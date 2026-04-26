import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { InlineEditableText } from './InlineEditableText';
import { resolveFormTheme } from '../theme/formThemes';

type FormHeaderProps = {
  title: string;
  description?: string;
  settings?: any;
  editable?: boolean;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  onTitleChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
};

export const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  description,
  settings = {},
  editable = false,
  titlePlaceholder = 'Form title',
  descriptionPlaceholder = 'Add description',
  onTitleChange,
  onDescriptionChange,
}) => {
  const theme = resolveFormTheme(settings);
  const hasHeaderImage = Boolean(settings.header_image_url);
  const hasLogo = Boolean(settings.logo_url);

  const renderMarkdown = (value: string, fontSize: string, fontWeight: number | string, opacity = 1) => (
    <div
      style={{
        fontSize,
        fontWeight,
        color: theme.text,
        opacity,
        lineHeight: fontSize === '36px' ? 1.2 : 1.6,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
          strong: ({ children }) => <strong style={{ color: theme.bold }}>{children}</strong>,
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );

  return (
    <div
      style={{
        overflow: 'hidden',
        borderRadius: hasHeaderImage ? '18px' : 0,
        border: hasHeaderImage ? `1px solid ${theme.border}` : 'none',
        background: hasHeaderImage ? theme.surface : 'transparent',
        boxShadow: hasHeaderImage ? '0 18px 42px rgba(18, 58, 63, 0.10)' : 'none',
      }}
    >
      {hasHeaderImage && (
        <div
          style={{
            position: 'relative',
            minHeight: '220px',
            backgroundImage: `linear-gradient(180deg, rgba(18, 58, 63, 0.08), rgba(18, 58, 63, 0.44)), url(${settings.header_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {hasLogo && (
            <div
              style={{
                position: 'absolute',
                top: '18px',
                insetInlineEnd: '18px',
                width: '86px',
                height: '86px',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.92)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 14px 34px rgba(0, 0, 0, 0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
              }}
            >
              <img
                src={settings.logo_url}
                alt=""
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      )}

      <div
        style={{
          padding: hasHeaderImage ? '26px 28px 30px' : 0,
          background: hasHeaderImage ? theme.surface : 'transparent',
        }}
      >
        {!hasHeaderImage && hasLogo && (
          <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'flex-end' }}>
            <img
              src={settings.logo_url}
              alt=""
              style={{
                width: '78px',
                height: '78px',
                objectFit: 'contain',
                borderRadius: '16px',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                padding: '8px',
              }}
            />
          </div>
        )}

        {editable ? (
          <>
            <InlineEditableText
              value={title}
              onChange={onTitleChange || (() => {})}
              placeholder={titlePlaceholder}
              isTitle={true}
              boldTextColor={theme.bold}
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: theme.text,
                lineHeight: '1.2',
                marginBottom: '8px',
                display: 'block',
                fontFamily: theme.fontFamily,
              }}
            />
            {description ? (
              <InlineEditableText
                value={description}
                onChange={onDescriptionChange || (() => {})}
                placeholder={descriptionPlaceholder}
                multiline={true}
                boldTextColor={theme.bold}
                style={{
                  fontSize: '16px',
                  color: theme.text,
                  opacity: 0.72,
                  lineHeight: '1.5',
                  fontFamily: theme.fontFamily,
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  const newDescription = prompt(descriptionPlaceholder) || '';
                  if (newDescription) {
                    onDescriptionChange?.(newDescription);
                  }
                }}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  font: 'inherit',
                  fontSize: '16px',
                  color: theme.text,
                  opacity: 0.48,
                  cursor: 'pointer',
                  fontStyle: 'italic',
                }}
              >
                {descriptionPlaceholder}
              </button>
            )}
          </>
        ) : (
          <>
            {renderMarkdown(title, '36px', 600)}
            {description && (
              <div style={{ marginTop: '16px' }}>
                {renderMarkdown(description, '17px', 400, 0.72)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
