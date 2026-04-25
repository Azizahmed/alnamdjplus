import React from 'react';
import { useI18n } from '../i18n';

interface SubscriptionDetailsProps {
  subscription: {
    has_subscription: boolean;
    status: string | null;
    plan: {
      id: number;
      name: string;
      price_monthly: number;
      price_yearly: number | null;
      credits_per_month: number;
      credits_per_analyze: number;
      credits_per_edit: number;
    } | null;
    credits: {
      balance: number;
      credits_per_month: number;
    } | null;
    current_period_start: string | null;
    current_period_end: string | null;
    next_billing_amount: number | null;
    billing_period: string | null;
    cancel_at_period_end: boolean;
  };
}

export const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({ subscription }) => {
  const { t } = useI18n();

  if (!subscription.has_subscription || !subscription.plan) {
    return (
      <div className="subscription-details">
        <p>{t.noActiveSubscription}</p>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return `$${amount.toFixed(2)}`;
  };

  const getNextBillingDate = () => {
    if (subscription.current_period_end) {
      return formatDate(subscription.current_period_end);
    }
    return 'N/A';
  };

  return (
    <div className="subscription-details">
      <div className="details-grid">
        <div className="detail-item">
          <label>{t.currentPlan}</label>
          <div className="detail-value plan-name">{subscription.plan.name}</div>
        </div>

        <div className="detail-item">
          <label>{t.billingPeriod}</label>
          <div className="detail-value">
            {subscription.billing_period ? subscription.billing_period.charAt(0).toUpperCase() + subscription.billing_period.slice(1) : 'N/A'}
          </div>
        </div>

        <div className="detail-item">
          <label>{t.status}</label>
          <div className="detail-value">
            <span className={`status-badge ${subscription.status === 'active' ? 'active' : 'inactive'}`}>
              {subscription.status || 'N/A'}
            </span>
          </div>
        </div>

        <div className="detail-item">
          <label>{t.currentPeriod}</label>
          <div className="detail-value">
            {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
          </div>
        </div>

        <div className="detail-item">
          <label>{t.nextBillingDate}</label>
          <div className="detail-value">{getNextBillingDate()}</div>
        </div>

        <div className="detail-item">
          <label>{t.nextBillingAmount}</label>
          <div className="detail-value">{formatCurrency(subscription.next_billing_amount)}</div>
        </div>

        {subscription.credits && (
          <>
            <div className="detail-item">
              <label>{t.creditsBalance}</label>
              <div className="detail-value">{subscription.credits.balance} / {subscription.credits.credits_per_month}</div>
            </div>

            <div className="detail-item">
              <label>{t.creditsPerDashboard}</label>
              <div className="detail-value">{subscription.plan.credits_per_analyze}</div>
            </div>

            <div className="detail-item">
              <label>{t.creditsPerEdit}</label>
              <div className="detail-value">{subscription.plan.credits_per_edit}</div>
            </div>
          </>
        )}

        {subscription.cancel_at_period_end && (
          <div className="detail-item cancel-warning">
            <label>{t.cancellationStatus}</label>
            <div className="detail-value">
              <span className="cancel-badge">{t.scheduledForCancellation}</span>
              <small>{t.accessContinuesUntil}</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
