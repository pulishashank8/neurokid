"""
Machine Learning Models Service for NeuroKid.

Provides:
1. Text Classification for content moderation
2. Sentiment Analysis for community health
3. Anomaly Detection for data quality
4. User Engagement Prediction

Dependencies: scikit-learn, pandas, numpy
"""

import logging
import json
import uuid
import pickle
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sqlalchemy import text

from database import get_session

logger = logging.getLogger('ml_service')

# Model storage directory
MODELS_DIR = Path(__file__).parent.parent / "trained_models"
MODELS_DIR.mkdir(exist_ok=True)


class ContentModerationModel:
    """
    ML-powered content moderation for community posts and comments.
    Uses TF-IDF + Naive Bayes for text classification.

    Purpose: Automatically flag potentially harmful, off-topic, or spam content
    to protect the NeuroKid community of autistic children and their parents.
    """

    CATEGORIES = ['safe', 'needs_review', 'spam', 'harmful']

    def __init__(self):
        self.model_path = MODELS_DIR / "content_moderation.pkl"
        self.pipeline: Optional[Pipeline] = None
        self._load_or_initialize()

    def _load_or_initialize(self):
        """Load existing model or create new one with initial training data."""
        if self.model_path.exists():
            try:
                with open(self.model_path, 'rb') as f:
                    self.pipeline = pickle.load(f)
                logger.info("Loaded existing content moderation model")
                return
            except Exception as e:
                logger.warning(f"Failed to load model: {e}")

        # Initialize with synthetic training data
        self._train_initial_model()

    def _train_initial_model(self):
        """Train initial model with seed data for autism support community."""
        # Training data relevant to autism support community
        training_data = [
            # Safe content - supportive community discussions
            ("My child had a great day at therapy today!", "safe"),
            ("Does anyone have tips for sensory activities?", "safe"),
            ("We tried the visual schedule and it helped so much", "safe"),
            ("Looking for recommendations for occupational therapists", "safe"),
            ("My son made his first friend at school today", "safe"),
            ("What strategies work for mealtime challenges?", "safe"),
            ("Grateful for this supportive community", "safe"),
            ("Our IEP meeting went well, here's what we learned", "safe"),
            ("Tips for explaining autism to siblings?", "safe"),
            ("Celebrating small wins - eye contact during conversation!", "safe"),
            ("Anyone use weighted blankets? Which brand works best?", "safe"),
            ("Sharing our experience with ABA therapy", "safe"),

            # Needs review - might need human moderation
            ("I'm feeling really overwhelmed with everything", "needs_review"),
            ("This diagnosis has been hard to accept", "needs_review"),
            ("Sometimes I don't know if I can do this anymore", "needs_review"),
            ("Frustrated with the school system", "needs_review"),
            ("Disagreeing with my partner about treatment", "needs_review"),
            ("The wait times for services are ridiculous", "needs_review"),

            # Spam
            ("Buy cheap products here click now!!!", "spam"),
            ("Make money fast work from home", "spam"),
            ("Free gift cards click this link", "spam"),
            ("Hot singles in your area", "spam"),
            ("Miracle cure for all conditions", "spam"),
            ("Subscribe to my channel for giveaways", "spam"),

            # Harmful - should be flagged immediately
            ("You should give up on your child", "harmful"),
            ("Autism can be cured with bleach", "harmful"),
            ("Your kid is just being bad", "harmful"),
            ("Stop wasting money on therapy", "harmful"),
            ("These parents are just making excuses", "harmful"),
            ("Vaccines cause autism you're poisoning your kids", "harmful"),
        ]

        texts, labels = zip(*training_data)

        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                max_features=1000,
                ngram_range=(1, 2),
                stop_words='english'
            )),
            ('clf', MultinomialNB(alpha=0.1))
        ])

        self.pipeline.fit(texts, labels)
        self._save_model()
        logger.info("Trained and saved initial content moderation model")

    def _save_model(self):
        """Save model to disk."""
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.pipeline, f)

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Predict content category with confidence scores.

        Returns:
            Dict with 'category', 'confidence', and 'probabilities'
        """
        if not self.pipeline:
            return {"category": "needs_review", "confidence": 0.0, "error": "Model not loaded"}

        # Get prediction and probabilities
        category = self.pipeline.predict([text])[0]
        probas = self.pipeline.predict_proba([text])[0]
        classes = self.pipeline.classes_

        prob_dict = {cls: float(prob) for cls, prob in zip(classes, probas)}
        confidence = max(probas)

        return {
            "category": category,
            "confidence": float(confidence),
            "probabilities": prob_dict,
            "requires_action": category in ['spam', 'harmful'],
            "model_version": "1.0"
        }

    def retrain(self, new_samples: List[Tuple[str, str]]):
        """Retrain model with new labeled samples."""
        if new_samples:
            texts, labels = zip(*new_samples)
            self.pipeline.fit(list(texts), list(labels))
            self._save_model()
            logger.info(f"Retrained model with {len(new_samples)} new samples")


class SentimentAnalyzer:
    """
    Sentiment analysis for community health monitoring.

    Purpose: Track overall community sentiment to identify when parents
    may need additional support or when community morale is low.
    """

    def __init__(self):
        self.model_path = MODELS_DIR / "sentiment_model.pkl"
        self.pipeline: Optional[Pipeline] = None
        self._load_or_initialize()

    def _load_or_initialize(self):
        if self.model_path.exists():
            try:
                with open(self.model_path, 'rb') as f:
                    self.pipeline = pickle.load(f)
                return
            except Exception:
                pass
        self._train_initial_model()

    def _train_initial_model(self):
        """Train with autism community-relevant sentiment data."""
        training_data = [
            # Positive sentiments
            ("We had a breakthrough today!", "positive"),
            ("So grateful for this community", "positive"),
            ("Therapy is really helping", "positive"),
            ("My child is thriving", "positive"),
            ("Finally found a great therapist", "positive"),
            ("Celebrating progress!", "positive"),
            ("The new strategies are working", "positive"),
            ("Feeling hopeful about the future", "positive"),

            # Neutral sentiments
            ("Has anyone tried this approach?", "neutral"),
            ("Looking for information about services", "neutral"),
            ("What time is the support group?", "neutral"),
            ("Sharing an article I found", "neutral"),
            ("New to this community", "neutral"),

            # Negative sentiments (needing support)
            ("Feeling exhausted and alone", "negative"),
            ("The diagnosis hit hard", "negative"),
            ("Struggling with the school system", "negative"),
            ("Insurance denied coverage again", "negative"),
            ("Having a really tough week", "negative"),
            ("Feeling like a failure as a parent", "negative"),
            ("Nobody understands what we go through", "negative"),
        ]

        texts, labels = zip(*training_data)

        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=500, ngram_range=(1, 2))),
            ('clf', MultinomialNB())
        ])

        self.pipeline.fit(texts, labels)

        with open(self.model_path, 'wb') as f:
            pickle.dump(self.pipeline, f)

    def analyze(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of text."""
        if not self.pipeline:
            return {"sentiment": "neutral", "confidence": 0.0}

        sentiment = self.pipeline.predict([text])[0]
        probas = self.pipeline.predict_proba([text])[0]
        confidence = max(probas)

        return {
            "sentiment": sentiment,
            "confidence": float(confidence),
            "needs_support": sentiment == "negative" and confidence > 0.7
        }


class AnomalyDetector:
    """
    Isolation Forest-based anomaly detection for data quality.

    Purpose: Detect unusual patterns in user activity, post frequency,
    or engagement metrics that might indicate issues or abuse.
    """

    def __init__(self):
        self.model = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, data: pd.DataFrame):
        """Fit the anomaly detector on historical data."""
        if data.empty:
            return

        numeric_data = data.select_dtypes(include=[np.number])
        if numeric_data.empty:
            return

        scaled_data = self.scaler.fit_transform(numeric_data)
        self.model.fit(scaled_data)
        self.is_fitted = True
        logger.info(f"Fitted anomaly detector on {len(data)} records")

    def detect(self, data: pd.DataFrame) -> pd.DataFrame:
        """Detect anomalies in new data."""
        if not self.is_fitted or data.empty:
            data['is_anomaly'] = False
            data['anomaly_score'] = 0.0
            return data

        numeric_data = data.select_dtypes(include=[np.number])
        if numeric_data.empty:
            data['is_anomaly'] = False
            data['anomaly_score'] = 0.0
            return data

        scaled_data = self.scaler.transform(numeric_data)
        predictions = self.model.predict(scaled_data)
        scores = self.model.decision_function(scaled_data)

        data['is_anomaly'] = predictions == -1
        data['anomaly_score'] = -scores  # Higher = more anomalous

        return data


class UserEngagementPredictor:
    """
    Predict user engagement and churn risk.

    Purpose: Identify users who might be disengaging so the platform
    can proactively offer support or resources.
    """

    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=50,
            max_depth=10,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_names = [
            'posts_last_30_days',
            'comments_last_30_days',
            'days_since_last_activity',
            'avg_session_duration',
            'total_sessions_30_days'
        ]

    def predict_churn_risk(self, user_metrics: Dict[str, float]) -> Dict[str, Any]:
        """
        Predict if a user is at risk of churning.

        Uses heuristic rules if model not fitted, ML model otherwise.
        """
        # Extract features
        posts = user_metrics.get('posts_last_30_days', 0)
        comments = user_metrics.get('comments_last_30_days', 0)
        days_inactive = user_metrics.get('days_since_last_activity', 0)

        # Heuristic-based risk assessment (works without training)
        risk_score = 0.0
        risk_factors = []

        if days_inactive > 14:
            risk_score += 0.4
            risk_factors.append("Inactive for 2+ weeks")
        elif days_inactive > 7:
            risk_score += 0.2
            risk_factors.append("Inactive for 1+ week")

        if posts == 0 and comments == 0:
            risk_score += 0.3
            risk_factors.append("No recent engagement")

        total_activity = posts + comments
        if total_activity < 2:
            risk_score += 0.2
            risk_factors.append("Low activity volume")

        risk_level = "low"
        if risk_score >= 0.6:
            risk_level = "high"
        elif risk_score >= 0.3:
            risk_level = "medium"

        return {
            "churn_risk_score": min(1.0, risk_score),
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommendation": self._get_recommendation(risk_level)
        }

    def _get_recommendation(self, risk_level: str) -> str:
        recommendations = {
            "high": "Consider sending a personalized check-in message and highlighting new relevant content",
            "medium": "Send a weekly digest with community highlights and new resources",
            "low": "User is engaged, continue normal communication"
        }
        return recommendations.get(risk_level, "Monitor engagement")


# =============================================================================
# AUTOMATION FUNCTIONS
# =============================================================================

async def run_content_moderation():
    """
    Automated content moderation job.
    Scans recent posts/comments and flags potentially problematic content.
    """
    logger.info("Starting content moderation automation")
    moderator = ContentModerationModel()
    flagged_items = []

    async with get_session() as conn:
        # Scan recent unmoderated posts
        posts_query = text("""
            SELECT id, content, title, "createdAt"
            FROM "Post"
            WHERE "createdAt" > NOW() - INTERVAL '24 hours'
            AND "moderationStatus" IS NULL OR "moderationStatus" = 'PENDING'
            LIMIT 100
        """)

        try:
            result = await conn.execute(posts_query)
            posts = result.mappings().all()

            for post in posts:
                content = f"{post.get('title', '')} {post.get('content', '')}"
                prediction = moderator.predict(content)

                if prediction['requires_action']:
                    flagged_items.append({
                        "type": "post",
                        "id": post['id'],
                        "category": prediction['category'],
                        "confidence": prediction['confidence']
                    })

                    # Update post status
                    await conn.execute(text("""
                        UPDATE "Post"
                        SET "moderationStatus" = 'FLAGGED',
                            "moderationNote" = :note
                        WHERE id = :id
                    """), {
                        "id": post['id'],
                        "note": f"ML flagged: {prediction['category']} ({prediction['confidence']:.2%})"
                    })

            await conn.commit()

        except Exception as e:
            logger.error(f"Content moderation error: {e}")

    logger.info(f"Content moderation complete. Flagged {len(flagged_items)} items")
    return {"status": "success", "flagged_count": len(flagged_items), "items": flagged_items}


async def run_community_health_analysis():
    """
    Analyze community sentiment and generate health report.
    """
    logger.info("Starting community health analysis")
    analyzer = SentimentAnalyzer()

    async with get_session() as conn:
        # Get recent posts and comments
        content_query = text("""
            SELECT content, 'post' as type FROM "Post"
            WHERE "createdAt" > NOW() - INTERVAL '7 days'
            UNION ALL
            SELECT content, 'comment' as type FROM "Comment"
            WHERE "createdAt" > NOW() - INTERVAL '7 days'
            LIMIT 500
        """)

        try:
            result = await conn.execute(content_query)
            content_items = result.mappings().all()

            sentiments = {"positive": 0, "neutral": 0, "negative": 0}
            needs_support_count = 0

            for item in content_items:
                analysis = analyzer.analyze(item['content'])
                sentiments[analysis['sentiment']] += 1
                if analysis.get('needs_support'):
                    needs_support_count += 1

            total = sum(sentiments.values())
            if total > 0:
                health_score = (
                    sentiments['positive'] * 1.0 +
                    sentiments['neutral'] * 0.5 +
                    sentiments['negative'] * 0.0
                ) / total * 100
            else:
                health_score = 50.0

            report = {
                "analysis_period": "7 days",
                "total_content_analyzed": total,
                "sentiment_distribution": sentiments,
                "community_health_score": round(health_score, 1),
                "users_needing_support": needs_support_count,
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Community health score: {health_score:.1f}")
            return report

        except Exception as e:
            logger.error(f"Community health analysis error: {e}")
            return {"status": "error", "message": str(e)}


async def run_user_engagement_check():
    """
    Check user engagement and identify at-risk users.
    """
    logger.info("Starting user engagement analysis")
    predictor = UserEngagementPredictor()

    async with get_session() as conn:
        # Get user activity metrics
        users_query = text("""
            SELECT
                u.id,
                u.email,
                COALESCE(p.post_count, 0) as posts_last_30_days,
                COALESCE(c.comment_count, 0) as comments_last_30_days,
                EXTRACT(DAY FROM NOW() - COALESCE(u."lastLoginAt", u."createdAt")) as days_since_last_activity
            FROM "User" u
            LEFT JOIN (
                SELECT "authorId", COUNT(*) as post_count
                FROM "Post"
                WHERE "createdAt" > NOW() - INTERVAL '30 days'
                GROUP BY "authorId"
            ) p ON u.id = p."authorId"
            LEFT JOIN (
                SELECT "authorId", COUNT(*) as comment_count
                FROM "Comment"
                WHERE "createdAt" > NOW() - INTERVAL '30 days'
                GROUP BY "authorId"
            ) c ON u.id = c."authorId"
            WHERE u."createdAt" < NOW() - INTERVAL '7 days'
            LIMIT 1000
        """)

        try:
            result = await conn.execute(users_query)
            users = result.mappings().all()

            at_risk_users = []

            for user in users:
                metrics = {
                    'posts_last_30_days': user['posts_last_30_days'] or 0,
                    'comments_last_30_days': user['comments_last_30_days'] or 0,
                    'days_since_last_activity': user['days_since_last_activity'] or 0
                }

                prediction = predictor.predict_churn_risk(metrics)

                if prediction['risk_level'] in ['medium', 'high']:
                    at_risk_users.append({
                        "user_id": user['id'],
                        "risk_level": prediction['risk_level'],
                        "risk_score": prediction['churn_risk_score'],
                        "factors": prediction['risk_factors'],
                        "recommendation": prediction['recommendation']
                    })

            logger.info(f"Found {len(at_risk_users)} users at risk of disengagement")

            return {
                "status": "success",
                "total_users_analyzed": len(users),
                "at_risk_count": len(at_risk_users),
                "at_risk_users": at_risk_users[:50],  # Limit response size
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"User engagement analysis error: {e}")
            return {"status": "error", "message": str(e)}
