import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useI18n } from '../i18n';

interface AccountProps {
  onClose?: () => void;
}

export const Account: React.FC<AccountProps> = ({ onClose }) => {
  const notification = useNotification();
  const { user, updateProfile, signOut } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setLoading(false);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      setError(t.nameCannotBeEmpty);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updateProfile({ name: editName });
      setEditing(false);
    } catch (err: any) {
      setError(err.message || t.failedToUpdateProfile);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    notification.showConfirm({
      title: t.deactivateAccount,
      message: t.deactivateConfirm,
      onConfirm: async () => {
        try {
          await signOut();
          window.location.href = '/';
        } catch (err: any) {
          setError(err.message || t.deactivateAccount);
          notification.error(err.message || t.deactivateAccount);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="account-container">
        <div className="account-card">
          <div className="loading">{t.loadingProfile}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-container">
      <div className="account-card">
        <div className="account-header">
          <h1>{t.accountSettingsTitle}</h1>
          {onClose && (
            <button onClick={onClose} className="close-button" aria-label={t.close}>
              x
            </button>
          )}
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {user && (
          <div className="account-content">
            {/* Profile Info */}
            <div className="info-section">
              <div className="info-group">
                <label>{t.email}</label>
                <div className="info-value">{user.email}</div>
              </div>

              <div className="info-group">
                <label>{t.name}</label>
                {editing ? (
                  <div className="edit-group">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="edit-input"
                      placeholder={t.enterYourName}
                    />
                    <div className="edit-actions">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        className="cta-button-primary"
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                      >
                        {saving ? t.saving : t.save}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditName(user.name || '');
                          setError(null);
                        }}
                        disabled={saving}
                        className="cta-button-secondary"
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="info-value-with-action">
                    <span>{user.name || t.notSet}</span>
                    <button
                      onClick={() => setEditing(true)}
                      className="edit-button"
                    >
                      {t.edit}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="danger-zone">
              <h3>{t.dangerZone}</h3>
              <p>{t.deactivateWarning}</p>
              <button
                onClick={handleDeactivateAccount}
                className="danger-button"
              >
                {t.deactivateAccount}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
