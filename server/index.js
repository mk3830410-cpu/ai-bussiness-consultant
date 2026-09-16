// ============================================================
// ENVIRONMENT
// ============================================================
require('dotenv').config();
const crypto = require('crypto');

const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://mk3830410-cpu-ai-bussiness-consulta.vercel.app';
const ALLOWED_ORIGINS = [
  FRONTEND_URL,
  'https://mk3830410-cpu-ai-bussiness-consulta.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// ============================================================
// EXPRESS
// ============================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security headers
app.use(helmet());

// Strict CORS for frontend origins (never wildcard * on authenticated routes)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1 || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Not allowed by CORS origin restriction'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature', 'X-Razorpay-Event-Id']
}));

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

    const proPlanId = process.env.RAZORPAY_PRO_PLAN_ID;
    if (!proPlanId) {
      return res.status(500).json({
        success: false,
        message: 'RAZORPAY_PRO_PLAN_ID is not configured in server environment.'
      });
    }

    // Read user's current Firestore subscription
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const existingSub = userData?.subscription;

    // Check if already actively subscribed to Pro
    if (existingSub && existingSub.plan === 'pro' && existingSub.status === 'active') {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_SUBSCRIBED',
        message: 'You already have an active Pro subscription.'
      });
    }

    // Create Razorpay Subscription with Firebase UID securely mapped in notes
    const subscriptionOptions = {
      plan_id: proPlanId,
      total_count: 12, // 12 monthly cycles
      quantity: 1,
      customer_notify: 1,
      notes: {
        firebase_uid: uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || ''
      }
    };

    const razorpaySubscription = await razorpay.subscriptions.create(subscriptionOptions);
    console.log(`[StratIQ Backend] Created Razorpay Subscription: ${razorpaySubscription.id} for UID: ${uid}`);

    // Store pending state in Firestore (pending != active, Pro features not granted)
    await userDocRef.set({
      subscription: {
        plan: 'pro',
        status: 'pending',
        razorpaySubscriptionId: razorpaySubscription.id,
        razorpayPlanId: razorpaySubscription.plan_id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true });

    return res.status(200).json({
      success: true,
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

    // Update Firestore to active
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.set({
      subscription: {
        plan: 'pro',
        status: 'active',
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpayPaymentId: razorpay_payment_id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      subscriptionPlan: 'pro' // For UI compatibility
    }, { merge: true });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and Founder Pro subscription activated successfully.'
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

        switch (eventName) {
          case 'subscription.authenticated':
            await userDocRef.set({
              subscription: {
                plan: 'pro',
                status: 'pending',
                razorpaySubscriptionId: subId,
                razorpayPlanId: planId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              }
            }, { merge: true });
            console.log(`[StratIQ Webhook] Handled subscription.authenticated for UID: ${targetUid}`);
            break;

          case 'subscription.activated':
          case 'subscription.charged':
            await userDocRef.set({
              subscription: {
                plan: 'pro',
                status: 'active',
                razorpaySubscriptionId: subId,
                razorpayPlanId: planId,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              },
              subscriptionPlan: 'pro'
            }, { merge: true });
            console.log(`[StratIQ Webhook] Activated Pro subscription for UID: ${targetUid}`);
            break;

          case 'subscription.updated':
            await userDocRef.set({
              subscription: {
                plan: 'pro',
                status: subscriptionEntity.status === 'active' ? 'active' : subscriptionEntity.status,
                razorpaySubscriptionId: subId,
                razorpayPlanId: planId,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              }
            }, { merge: true });
            console.log(`[StratIQ Webhook] Updated subscription for UID: ${targetUid}`);
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
  console.log(`🔒 Environment: ${NODE_ENV}`);
  console.log(`🔗 Allowed Frontend: ${FRONTEND_URL}`);
  console.log(`====================================================`);
});
