// ============================================================
// ENVIRONMENT
// ============================================================
require('dotenv').config();
const crypto = require('crypto');

const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://mk3830410-cpu-ai-bussiness-consulta.vercel.app';

// Helper to parse comma-separated origin strings and normalize trailing slashes
function parseOriginList(val) {
  if (!val) return [];
  return val
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

const DEV_PREVIEW_ORIGINS = parseOriginList(process.env.DEV_PREVIEW_ORIGINS);
const ADDITIONAL_ALLOWED_ORIGINS = parseOriginList(process.env.ADDITIONAL_ALLOWED_ORIGINS);

const isProduction = NODE_ENV === 'production';

// Production allowed origins: ONLY explicitly configured origins. Never wildcard (*).
const PRODUCTION_ALLOWED_ORIGINS = Array.from(new Set([
  FRONTEND_URL.replace(/\/+$/, ''),
  'https://mk3830410-cpu-ai-bussiness-consulta.vercel.app',
  ...ADDITIONAL_ALLOWED_ORIGINS
])).filter(Boolean);

// Development allowed origins: FRONTEND_URL, localhost ports, DEV_PREVIEW_ORIGINS, ADDITIONAL_ALLOWED_ORIGINS
const DEV_ALLOWED_ORIGINS = Array.from(new Set([
  FRONTEND_URL.replace(/\/+$/, ''),
  'https://mk3830410-cpu-ai-bussiness-consulta.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  ...DEV_PREVIEW_ORIGINS,
  ...ADDITIONAL_ALLOWED_ORIGINS
])).filter(Boolean);

// ============================================================
// EXPRESS
// ============================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server webhooks like Razorpay)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/+$/, '');
    
    // Log ONLY the origin for debugging (never log auth headers, tokens, or credentials)
    console.log(`[StratIQ CORS] Request origin: ${cleanOrigin}`);

    let isAllowed = false;

    if (isProduction) {
      // PRODUCTION MODE: Strictly allow only explicitly configured production origins
      isAllowed = PRODUCTION_ALLOWED_ORIGINS.includes(cleanOrigin);
    } else {
      // DEVELOPMENT MODE: FRONTEND_URL, localhost, and DEV_PREVIEW_ORIGINS
      const isLocalhost = 
        cleanOrigin.startsWith('http://localhost:') || 
        cleanOrigin.startsWith('http://127.0.0.1:');

      isAllowed = isLocalhost || DEV_ALLOWED_ORIGINS.includes(cleanOrigin);
    }

    if (isAllowed) {
      console.log(`[StratIQ CORS] Allowed origin: ${cleanOrigin}`);
      return callback(null, true);
    } else {
      console.warn(`[StratIQ CORS] Rejected origin: ${cleanOrigin}`);
      const err = new Error(`CORS policy: Not allowed by CORS origin restriction`);
      err.statusCode = 403;
      return callback(err);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Razorpay-Signature',
    'X-Razorpay-Event-Id'
  ],
  optionsSuccessStatus: 204
};

// Mount CORS middleware & handle preflight OPTIONS across all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Capture raw body buffer for Razorpay webhook signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// FIREBASE ADMIN
// ============================================================
const admin = require('firebase-admin');

let isFirebaseAdminReady = false;
let db = null;
let auth = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Handle escaped newlines in environment variable
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    db = admin.firestore();
    auth = admin.auth();
    isFirebaseAdminReady = true;
    console.log('[StratIQ Backend] Firebase Admin SDK initialized successfully.');
  } else {
    // Attempt default application credentials if running in GCP/Firebase environment
    try {
      admin.initializeApp();
      db = admin.firestore();
      auth = admin.auth();
      isFirebaseAdminReady = true;
      console.log('[StratIQ Backend] Firebase Admin SDK initialized using default environment credentials.');
    } catch {
      console.warn('[StratIQ Backend] Warning: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY not fully configured.');
    }
  }
} catch (err) {
  console.error('[StratIQ Backend] Error during Firebase Admin initialization:', err.message);
}

// ============================================================
// RAZORPAY
// ============================================================
const Razorpay = require('razorpay');

let razorpay = null;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
  console.log('[StratIQ Backend] Razorpay SDK initialized successfully.');
} else {
  console.warn('[StratIQ Backend] Warning: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured yet.');
}

// ============================================================
// AUTH HELPER
// ============================================================
async function verifyFirebaseUser(req) {
  if (!isFirebaseAdminReady || !auth) {
    const error = new Error('Firebase Admin SDK is not configured on the server');
    error.statusCode = 503;
    throw error;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Unauthorized: Missing or malformed Authorization header');
    error.statusCode = 401;
    throw error;
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    const error = new Error('Unauthorized: Token empty');
    error.statusCode = 401;
    throw error;
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    // Never trust req.body.uid or req.query.uid; decodedToken.uid is the single source of truth
    return decodedToken;
  } catch (err) {
    console.warn('[StratIQ Backend] Failed to verify Firebase token:', err.message);
    const error = new Error('Unauthorized: Invalid or expired authentication token');
    error.statusCode = 401;
    throw error;
  }
}

// ============================================================
// HEALTH
// ============================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'StratIQ API',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Root friendly ping
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'StratIQ API',
    message: 'StratIQ backend server running on Render',
    health: '/health'
  });
});

// ============================================================
// CREATE SUBSCRIPTION
// ============================================================
app.post('/api/razorpay/create-subscription', async (req, res, next) => {
  try {
    const decodedToken = await verifyFirebaseUser(req);
    const uid = decodedToken.uid;
    console.log(`[StratIQ Backend] POST /api/razorpay/create-subscription for UID: ${uid}`);

    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay is not configured on the server. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
      });
    }

    const planType = (req.body?.planType === 'enterprise') ? 'enterprise' : 'pro';
    const planEnvKey = planType === 'enterprise' ? 'RAZORPAY_TEAM_PLAN_ID' : 'RAZORPAY_PRO_PLAN_ID';
    const planId = planType === 'enterprise' 
      ? (process.env.RAZORPAY_TEAM_PLAN_ID || process.env.RAZORPAY_SCALE_PLAN_ID) 
      : process.env.RAZORPAY_PRO_PLAN_ID;

    if (!planId) {
      return res.status(500).json({
        success: false,
        message: `${planEnvKey} is not configured in server environment. Please set it in Render to support ${planType === 'enterprise' ? 'Team Scale ($99/mo)' : 'Founder Pro ($29/mo)'}.`
      });
    }

    // Read user's current Firestore subscription
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const existingSub = userData?.subscription;

    // Check if already actively subscribed to this plan
    if (existingSub && existingSub.plan === planType && existingSub.status === 'active') {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_SUBSCRIBED',
        message: `You already have an active ${planType === 'enterprise' ? 'Team Scale' : 'Founder Pro'} subscription.`
      });
    }

    // Create Razorpay Subscription with Firebase UID securely mapped in notes
    const subscriptionOptions = {
      plan_id: planId,
      total_count: 12, // 12 monthly cycles
      quantity: 1,
      customer_notify: 1,
      notes: {
        firebase_uid: uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || '',
        plan_type: planType
      }
    };

    const razorpaySubscription = await razorpay.subscriptions.create(subscriptionOptions);
    console.log(`[StratIQ Backend] Created Razorpay Subscription: ${razorpaySubscription.id} (${planType}) for UID: ${uid}`);

    // Store pending state in Firestore (pending != active, features not granted)
    await userDocRef.set({
      subscription: {
        plan: planType,
        status: 'pending',
        razorpaySubscriptionId: razorpaySubscription.id,
        razorpayPlanId: razorpaySubscription.plan_id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true });

    return res.status(200).json({
      success: true,
      planType,
      subscriptionId: razorpaySubscription.id,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// VERIFY PAYMENT
// ============================================================
app.post('/api/razorpay/verify', async (req, res, next) => {
  try {
    const decodedToken = await verifyFirebaseUser(req);
    const uid = decodedToken.uid;
    console.log(`[StratIQ Backend] POST /api/razorpay/verify for UID: ${uid}`);

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment confirmation fields.'
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Server error: Missing Razorpay Key Secret.'
      });
    }

    // Razorpay subscription signature verification: HMAC-SHA256(payment_id + "|" + subscription_id)
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn(`[StratIQ Backend] Signature verification failed for UID: ${uid}, Sub: ${razorpay_subscription_id}`);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed.'
      });
    }

    console.log(`[StratIQ Backend] Signature successfully verified for UID: ${uid}, Sub: ${razorpay_subscription_id}`);

    // Read user document to preserve requested plan type or fallback to request body / default
    const userDocRef = db.collection('users').doc(uid);
    const existingDoc = await userDocRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : null;
    const planType = req.body?.planType || existingData?.subscription?.plan || 'pro';

    // Update Firestore to active
    await userDocRef.set({
      subscription: {
        plan: planType,
        status: 'active',
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpayPaymentId: razorpay_payment_id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      subscriptionPlan: planType // For UI compatibility
    }, { merge: true });

    return res.status(200).json({
      success: true,
      planType,
      message: `Payment verified and ${planType === 'enterprise' ? 'Team Scale ($99/mo)' : 'Founder Pro ($29/mo)'} subscription activated successfully.`
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// WEBHOOK
// ============================================================
app.post('/api/razorpay/webhook', async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[StratIQ Webhook] RAZORPAY_WEBHOOK_SECRET is not configured on server.');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    if (!webhookSignature) {
      console.warn('[StratIQ Webhook] Missing X-Razorpay-Signature header.');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify raw body HMAC
    const rawPayload = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayload)
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      console.warn('[StratIQ Webhook] Webhook signature verification failed.');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body;
    const eventName = event.event;
    const eventId = req.headers['x-razorpay-event-id'] || event.id || `${eventName}_${event.created_at || Date.now()}`;
    console.log(`[StratIQ Webhook] Received verified webhook event: ${eventName} (ID: ${eventId})`);

    // Idempotency check with Firestore
    if (db) {
      const eventDocRef = db.collection('webhookEvents').doc(eventId);
      const eventDoc = await eventDocRef.get();
      if (eventDoc.exists) {
        console.log(`[StratIQ Webhook] Event ${eventId} already processed. Skipping duplicate.`);
        return res.status(200).json({ success: true, message: 'Event already processed' });
      }

      // Record event ID for idempotency
      await eventDocRef.set({
        eventId,
        event: eventName,
        receivedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Process subscription events
    const subscriptionEntity = event.payload?.subscription?.entity;
    if (subscriptionEntity) {
      const subId = subscriptionEntity.id;
      const planId = subscriptionEntity.plan_id;
      let targetUid = subscriptionEntity.notes?.firebase_uid;

      // If UID not in notes, search Firestore users collection by razorpaySubscriptionId
      if (!targetUid && db) {
        const querySnapshot = await db.collection('users')
          .where('subscription.razorpaySubscriptionId', '==', subId)
          .limit(1)
          .get();

        if (!querySnapshot.empty) {
          targetUid = querySnapshot.docs[0].id;
        }
      }

      if (targetUid && db) {
        const userDocRef = db.collection('users').doc(targetUid);
        const periodStart = subscriptionEntity.current_start 
          ? new Date(subscriptionEntity.current_start * 1000).toISOString() 
          : null;
        const periodEnd = subscriptionEntity.current_end 
          ? new Date(subscriptionEntity.current_end * 1000).toISOString() 
          : null;

        const targetPlan = (
          subscriptionEntity.notes?.plan_type === 'enterprise' || 
          planId === process.env.RAZORPAY_TEAM_PLAN_ID || 
          planId === process.env.RAZORPAY_SCALE_PLAN_ID
        ) ? 'enterprise' : 'pro';

        switch (eventName) {
          case 'subscription.authenticated':
            await userDocRef.set({
              subscription: {
                plan: targetPlan,
                status: 'pending',
                razorpaySubscriptionId: subId,
                razorpayPlanId: planId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              }
            }, { merge: true });
            console.log(`[StratIQ Webhook] Handled subscription.authenticated for UID: ${targetUid} (${targetPlan})`);
            break;

          case 'subscription.activated':
          case 'subscription.charged':
            await userDocRef.set({
              subscription: {
                plan: targetPlan,
                status: 'active',
                razorpaySubscriptionId: subId,
                razorpayPlanId: planId,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              },
              subscriptionPlan: targetPlan
            }, { merge: true });
            console.log(`[StratIQ Webhook] Activated ${targetPlan} subscription for UID: ${targetUid}`);
            break;

          case 'subscription.updated':
            await userDocRef.set({
              subscription: {
                plan: targetPlan,
                status: subscriptionEntity.status === 'active' ? 'active' : subscriptionEntity.status,
                razorpaySubscriptionId: subId,
                razorpayPlanId: planId,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              },
              subscriptionPlan: targetPlan
            }, { merge: true });
            console.log(`[StratIQ Webhook] Updated ${targetPlan} subscription for UID: ${targetUid}`);
            break;

          case 'subscription.pending':
            await userDocRef.set({
              'subscription.status': 'pending',
              'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`[StratIQ Webhook] Set subscription to pending for UID: ${targetUid}`);
            break;

          case 'subscription.halted':
            await userDocRef.set({
              'subscription.status': 'halted',
              'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
              'subscriptionPlan': 'starter'
            }, { merge: true });
            console.log(`[StratIQ Webhook] Set subscription to halted for UID: ${targetUid}`);
            break;

          case 'subscription.cancelled':
            await userDocRef.set({
              'subscription.status': 'cancelled',
              'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
              'subscriptionPlan': 'starter'
            }, { merge: true });
            console.log(`[StratIQ Webhook] Set subscription to cancelled for UID: ${targetUid}`);
            break;

          case 'subscription.completed':
            await userDocRef.set({
              'subscription.status': 'completed',
              'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
              'subscriptionPlan': 'starter'
            }, { merge: true });
            console.log(`[StratIQ Webhook] Set subscription to completed for UID: ${targetUid}`);
            break;

          default:
            console.log(`[StratIQ Webhook] Ignored unhandled event: ${eventName}`);
            break;
        }
      } else {
        console.warn(`[StratIQ Webhook] Could not find associated Firebase UID for subscription: ${subId}`);
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    console.error('[StratIQ Webhook] Processing error:', err.message);
    return res.status(500).json({ error: 'Internal server error processing webhook' });
  }
});

// ============================================================
// CURRENT SUBSCRIPTION
// ============================================================
app.get('/api/subscription/me', async (req, res, next) => {
  try {
    const decodedToken = await verifyFirebaseUser(req);
    const uid = decodedToken.uid;
    console.log(`[StratIQ Backend] GET /api/subscription/me for UID: ${uid}`);

    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Firestore database is not initialized on the server.'
      });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(200).json({
        success: true,
        subscription: {
          plan: 'starter',
          status: 'inactive'
        }
      });
    }

    const data = userDoc.data();
    const subscription = data?.subscription || {
      plan: data?.subscriptionPlan || 'starter',
      status: data?.subscriptionPlan === 'pro' ? 'active' : 'inactive'
    };

    return res.status(200).json({
      success: true,
      subscription
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// USAGE & SUBSCRIPTION ENTITLEMENT ENFORCEMENT
// ============================================================

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * GET /api/usage/me
 * Returns the caller's usage data and verified subscription tier from Firestore
 */
app.get('/api/usage/me', async (req, res, next) => {
  try {
    const decodedToken = await verifyFirebaseUser(req);
    const uid = decodedToken.uid;

    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Firestore database is not initialized on the server.'
      });
    }

    const currentPeriod = getCurrentMonthKey();
    const [userDoc, usageDoc] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('users').doc(uid).collection('usage').doc('current').get()
    ]);

    const userData = userDoc.exists ? userDoc.data() : null;
    const subscription = userData?.subscription || {
      plan: userData?.subscriptionPlan || 'starter',
      status: userData?.subscriptionPlan === 'pro' ? 'active' : 'inactive'
    };

    let usage = usageDoc.exists ? usageDoc.data() : null;
    if (!usage || usage.periodMonth !== currentPeriod) {
      usage = {
        periodMonth: currentPeriod,
        analysesCount: 0,
        advisorMessagesCount: 0,
        lastUpdated: Date.now()
      };
    }

    return res.status(200).json({
      success: true,
      subscription,
      usage
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/usage/record-analysis
 * Authoritatively verifies the user's plan and enforces Starter restrictions:
 * - Starter plan: Max 3 Quick Brainstorms/Market Pulse per month.
 * - Deep Dive & Visual Spark: Forbidden on Starter; requires active Founder Pro.
 */
app.post('/api/usage/record-analysis', async (req, res, next) => {
  try {
    const decodedToken = await verifyFirebaseUser(req);
    const uid = decodedToken.uid;
    const mode = req.body?.mode || 'quick';
    const currentPeriod = getCurrentMonthKey();

    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Firestore is not initialized on the server.'
      });
    }

    // 1. Fetch user's subscription and current monthly usage
    const [userDoc, usageDoc] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('users').doc(uid).collection('usage').doc('current').get()
    ]);

    const userData = userDoc.exists ? userDoc.data() : null;
    const subscription = userData?.subscription || {
      plan: userData?.subscriptionPlan || 'starter',
      status: userData?.subscriptionPlan === 'pro' ? 'active' : 'inactive'
    };

    const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';
    const isEnterprise = subscription?.plan === 'enterprise' && subscription?.status === 'active';
    const isPaidActive = isPro || isEnterprise;

    // 2. Feature Gating: Deep Dive & Visual Spark require active Founder Pro
    if (!isPaidActive && (mode === 'deep' || mode === 'visual')) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_FEATURE',
        requiredPlan: 'pro',
        feature: mode === 'deep' ? 'Deep Dive Strategy' : 'Visual Spark Analysis',
        message: `${mode === 'deep' ? 'Deep Dive Strategies' : 'Visual Spark Analysis'} is available with Founder Pro. Upgrade to continue.`
      });
    }

    // 3. Rate Limiting: Starter plan is capped at 3 analyses per month
    let usage = usageDoc.exists ? usageDoc.data() : null;
    if (!usage || usage.periodMonth !== currentPeriod) {
      usage = {
        periodMonth: currentPeriod,
        analysesCount: 0,
        advisorMessagesCount: 0,
        lastUpdated: Date.now()
      };
    }

    if (!isPaidActive && usage.analysesCount >= 3) {
      return res.status(403).json({
        success: false,
        code: 'LIMIT_REACHED',
        requiredPlan: 'pro',
        limit: 3,
        currentUsage: usage.analysesCount,
        message: 'Your Starter plan limit has been reached (3 Quick Brainstorms per month). Upgrade to Founder Pro to continue.'
      });
    }

    // 4. Increment usage
    const updatedUsage = {
      periodMonth: currentPeriod,
      analysesCount: (usage.analysesCount || 0) + 1,
      advisorMessagesCount: usage.advisorMessagesCount || 0,
      lastUpdated: Date.now()
    };

    await db.collection('users').doc(uid).collection('usage').doc('current').set(updatedUsage, { merge: true });

    return res.status(200).json({
      success: true,
      usage: updatedUsage,
      remaining: isPaidActive ? 'unlimited' : Math.max(0, 3 - updatedUsage.analysesCount)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/usage/record-advisor
 * Enforces free advisor limits for Starter users (5 messages/mo)
 */
app.post('/api/usage/record-advisor', async (req, res, next) => {
  try {
    const decodedToken = await verifyFirebaseUser(req);
    const uid = decodedToken.uid;
    const currentPeriod = getCurrentMonthKey();

    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Firestore is not initialized.'
      });
    }

    const [userDoc, usageDoc] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('users').doc(uid).collection('usage').doc('current').get()
    ]);

    const userData = userDoc.exists ? userDoc.data() : null;
    const subscription = userData?.subscription || {
      plan: userData?.subscriptionPlan || 'starter',
      status: 'inactive'
    };

    const isPaidActive = (subscription?.plan === 'pro' || subscription?.plan === 'enterprise') && subscription?.status === 'active';

    let usage = usageDoc.exists ? usageDoc.data() : null;
    if (!usage || usage.periodMonth !== currentPeriod) {
      usage = {
        periodMonth: currentPeriod,
        analysesCount: 0,
        advisorMessagesCount: 0,
        lastUpdated: Date.now()
      };
    }

    if (!isPaidActive && usage.advisorMessagesCount >= 5) {
      return res.status(403).json({
        success: false,
        code: 'LIMIT_REACHED',
        requiredPlan: 'pro',
        message: 'You have reached your 5 free AI Advisor questions for this month. Upgrade to Founder Pro for priority 24/7 AI Advisor support.'
      });
    }

    const updatedUsage = {
      periodMonth: currentPeriod,
      analysesCount: usage.analysesCount || 0,
      advisorMessagesCount: (usage.advisorMessagesCount || 0) + 1,
      lastUpdated: Date.now()
    };

    await db.collection('users').doc(uid).collection('usage').doc('current').set(updatedUsage, { merge: true });

    return res.status(200).json({
      success: true,
      usage: updatedUsage,
      remaining: isPaidActive ? 'unlimited' : Math.max(0, 5 - updatedUsage.advisorMessagesCount)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/entitlements/verify
 * Validates whether user is entitled to perform protected actions:
 * - 'financial_projections'
 * - 'csv_export'
 * - 'pdf_export'
 * - 'strategy_comparison'
 */
app.post('/api/entitlements/verify', async (req, res, next) => {
  try {
    const decodedToken = await verifyFirebaseUser(req);
    const uid = decodedToken.uid;
    const feature = req.body?.feature;

    if (!db) {
      return res.status(503).json({ success: false, message: 'Firestore is not initialized.' });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const subscription = userData?.subscription || { plan: 'starter', status: 'inactive' };

    const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';
    const isEnterprise = subscription?.plan === 'enterprise' && subscription?.status === 'active';
    const isPaidActive = isPro || isEnterprise;

    if (!isPaidActive) {
      return res.status(403).json({
        success: false,
        entitled: false,
        requiredPlan: 'pro',
        feature,
        message: `This feature (${feature}) is available with Founder Pro. Upgrade to continue.`
      });
    }

    return res.status(200).json({
      success: true,
      entitled: true,
      plan: isEnterprise ? 'enterprise' : 'pro'
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[StratIQ Backend Error] ${statusCode} - ${message}`);

  // Never leak credentials or stack traces to client
  res.status(statusCode).json({
    success: false,
    message
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`
  });
});

// ============================================================
// SERVER START
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 StratIQ Backend API Server running on port ${PORT}`);
  console.log(`🌐 Listening on 0.0.0.0:${PORT}`);
  console.log(`🔒 Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`🔗 Allowed Origins (${isProduction ? 'Production' : 'Development'}):`);
  const activeOrigins = isProduction ? PRODUCTION_ALLOWED_ORIGINS : DEV_ALLOWED_ORIGINS;
  activeOrigins.forEach((orig) => console.log(`   - ${orig}`));
  if (!isProduction && DEV_PREVIEW_ORIGINS.length > 0) {
    console.log(`   (DEV_PREVIEW_ORIGINS loaded: ${DEV_PREVIEW_ORIGINS.length})`);
  }
  console.log(`====================================================`);
});
