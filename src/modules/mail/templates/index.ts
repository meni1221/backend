type BrandedEmailAction = {
  label: string;
  url: string;
};

type BrandedEmailOptions = {
  action?: BrandedEmailAction;
  body: string[];
  direction?: 'rtl' | 'ltr';
  logoUrl: string;
  title: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const renderParagraph = (text: string) =>
  `<p style="margin:0 0 14px;color:#1f2a44;font-size:16px;line-height:1.75">${escapeHtml(text).replace(/\n/g, '<br />')}</p>`;

export const renderBrandedEmail = ({
  action,
  body,
  direction = 'rtl',
  logoUrl,
  title,
}: BrandedEmailOptions) => `
  <!doctype html>
  <html dir="${direction}">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;background:#f4f8fb;font-family:Arial,'Helvetica Neue',sans-serif">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f8fb;padding:28px 12px">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dbe7ee;border-radius:14px;overflow:hidden">
              <tr>
                <td style="background:#071a35;padding:22px 28px;text-align:center">
                  <img src="${escapeHtml(logoUrl)}" alt="אישרו" width="150" style="display:inline-block;max-width:150px;height:auto;border:0;background:#ffffff;border-radius:10px;padding:6px" />
                </td>
              </tr>
              <tr>
                <td style="padding:30px 30px 8px;text-align:${direction === 'rtl' ? 'right' : 'left'}">
                  <div style="display:inline-block;margin-bottom:12px;padding:5px 10px;border-radius:999px;background:#e9fbf4;color:#08764d;font-size:13px;font-weight:700">אישרו?</div>
                  <h1 style="margin:0;color:#071a35;font-size:26px;line-height:1.35">${escapeHtml(title)}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 30px 26px;text-align:${direction === 'rtl' ? 'right' : 'left'}">
                  ${body.map(renderParagraph).join('')}
                  ${action ? `
                    <div style="margin-top:22px">
                      <a href="${escapeHtml(action.url)}" style="display:inline-block;padding:13px 22px;background:#2fd18b;color:#071a35;text-decoration:none;border-radius:10px;font-weight:800;font-size:15px">${escapeHtml(action.label)}</a>
                    </div>
                  ` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding:18px 30px;background:#f7fbfd;border-top:1px solid #e1edf3;text-align:center;color:#6a7485;font-size:13px">
                  נשלח ממערכת אישרו לניהול אירועים ואישורי הגעה.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;
