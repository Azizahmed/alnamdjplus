import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { brandTokens } from '../theme/brand';
import { FORM_THEMES, resolveFormTheme, themeToSettings } from '../theme/formThemes';

type FormDesignPanelProps = {
  formId: string;
  settings: any;
  onSettingsPatch: (patch: Record<string, any>) => Promise<void> | void;
};

const HEADER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const HEADER_MAX_SIZE = 5 * 1024 * 1024;
const LOGO_MAX_SIZE = 2 * 1024 * 1024;

const sanitizeFileName = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120) || 'image';

export const FormDesignPanel: React.FC<FormDesignPanelProps> = ({ formId, settings, onSettingsPatch }) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState<'header' | 'logo' | null>(null);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const currentTheme = resolveFormTheme(settings);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !containerRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const uploadImage = async (file: File, kind: 'header' | 'logo') => {
    const isHeader = kind === 'header';
    const allowedTypes = isHeader ? HEADER_TYPES : LOGO_TYPES;
    const maxSize = isHeader ? HEADER_MAX_SIZE : LOGO_MAX_SIZE;

    if (!allowedTypes.includes(file.type)) {
      setError(isHeader ? 'اختر صورة بصيغة JPG أو PNG أو WebP.' : 'اختر شعارا بصيغة JPG أو PNG أو WebP أو SVG.');
      return;
    }

    if (file.size > maxSize) {
      setError(isHeader ? 'حجم صورة الترويسة يجب ألا يتجاوز 5MB.' : 'حجم الشعار يجب ألا يتجاوز 2MB.');
      return;
    }

    setError('');
    setUploading(kind);
    try {
      const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const prefix = isHeader ? 'header' : 'logo';
      const key = `form-design/${formId}/${prefix}-${randomPart}-${sanitizeFileName(file.name)}`;
      const result = await api.storage.upload('form-uploads', file, key);
      await onSettingsPatch(isHeader
        ? { header_image_url: result.url, header_image_key: result.key }
        : { logo_url: result.url, logo_key: result.key });
    } catch (err: any) {
      setError(err?.message || 'تعذر رفع الصورة. حاول مرة أخرى.');
    } finally {
      setUploading(null);
    }
  };

  const removeAsset = async (kind: 'header' | 'logo') => {
    const isHeader = kind === 'header';
    const key = isHeader ? settings.header_image_key : settings.logo_key;

    if (key) {
      try {
        await api.storage.remove('form-uploads', key);
      } catch (err) {
        console.error('Failed to remove old design asset:', err);
      }
    }

    await onSettingsPatch(isHeader
      ? { header_image_url: null, header_image_key: null }
      : { logo_url: null, logo_key: null });
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          minHeight: '42px',
          padding: '0 16px',
          borderRadius: '14px',
          border: `1px solid ${brandTokens.border}`,
          background: '#ffffff',
          color: brandTokens.text,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(18, 58, 63, 0.06)',
        }}
      >
        <span
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.bold})`,
            border: `1px solid ${currentTheme.border}`,
          }}
        />
        التصميم
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: '128px',
            right: '16px',
            width: 'min(360px, calc(100vw - 32px))',
            maxWidth: 'calc(100vw - 32px)',
            padding: '16px',
            background: '#ffffff',
            border: `1px solid ${brandTokens.border}`,
            borderRadius: '16px',
            boxShadow: '0 22px 60px rgba(18, 58, 63, 0.18)',
            zIndex: 2000,
            direction: 'rtl',
            maxHeight: 'calc(100vh - 150px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 900, color: brandTokens.text, marginBottom: '12px' }}>
            اختر مظهر النموذج
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {FORM_THEMES.map((theme) => {
              const selected = currentTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onSettingsPatch(themeToSettings(theme))}
                  style={{
                    textAlign: 'right',
                    padding: '10px',
                    borderRadius: '12px',
                    border: selected ? `2px solid ${theme.accent}` : `1px solid ${brandTokens.border}`,
                    background: selected ? '#F7FAF8' : '#ffffff',
                    cursor: 'pointer',
                    display: 'grid',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {theme.swatches.map((color) => (
                      <span
                        key={color}
                        style={{ width: '22px', height: '18px', borderRadius: '6px', background: color, border: '1px solid rgba(0,0,0,0.08)' }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: brandTokens.text }}>{theme.name}</span>
                </button>
              );
            })}
          </div>

          <div style={{ borderTop: `1px solid ${brandTokens.border}`, paddingTop: '14px', display: 'grid', gap: '10px' }}>
            <input
              ref={headerInputRef}
              type="file"
              accept={HEADER_TYPES.join(',')}
              style={{ display: 'none' }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadImage(file, 'header');
                event.currentTarget.value = '';
              }}
            />
            <input
              ref={logoInputRef}
              type="file"
              accept={LOGO_TYPES.join(',')}
              style={{ display: 'none' }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadImage(file, 'logo');
                event.currentTarget.value = '';
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button type="button" onClick={() => headerInputRef.current?.click()} style={assetButtonStyle}>
                {uploading === 'header' ? 'جار الرفع...' : 'صورة الترويسة'}
              </button>
              <button type="button" onClick={() => logoInputRef.current?.click()} style={assetButtonStyle}>
                {uploading === 'logo' ? 'جار الرفع...' : 'الشعار'}
              </button>
            </div>

            {(settings.header_image_url || settings.logo_url) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="button" disabled={!settings.header_image_url} onClick={() => removeAsset('header')} style={removeButtonStyle}>
                  حذف الترويسة
                </button>
                <button type="button" disabled={!settings.logo_url} onClick={() => removeAsset('logo')} style={removeButtonStyle}>
                  حذف الشعار
                </button>
              </div>
            )}

            {error && (
              <div style={{ padding: '10px', borderRadius: '10px', background: brandTokens.dangerSoft, color: brandTokens.danger, fontSize: '12px' }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const assetButtonStyle: React.CSSProperties = {
  minHeight: '40px',
  borderRadius: '10px',
  border: `1px solid ${brandTokens.border}`,
  background: '#F7FAF8',
  color: brandTokens.primary,
  fontWeight: 800,
  cursor: 'pointer',
};

const removeButtonStyle: React.CSSProperties = {
  minHeight: '36px',
  borderRadius: '10px',
  border: `1px solid ${brandTokens.border}`,
  background: '#ffffff',
  color: brandTokens.textSoft,
  fontWeight: 700,
  cursor: 'pointer',
};
