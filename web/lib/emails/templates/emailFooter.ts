/**
 * Shared branded footer for transactional emails (inline HTML for Resend).
 */

export function getEmailFooterHtml(): string {
  return `
          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px 16px; background-color: #16193a; text-align: center; border-top: 3px solid #DFAF37;">
              <p style="margin: 0; font-size: 15px; font-family: Georgia, 'Times New Roman', serif; color: #ffffff; font-weight: 600; letter-spacing: 0.02em;">
                ThriftShopper
              </p>
              <p style="margin: 3px 0 0; font-size: 11px; color: #DFAF37; font-style: italic; line-height: 1.3;">
                the magic of discovery<sup style="font-size: 0.55em; font-style: normal;">TM</sup>
              </p>
              <p style="margin: 10px 0 0; font-size: 11px; line-height: 1.4; color: rgba(255,255,255,0.82);">
                Questions? <a href="mailto:support@thriftshopper.com" style="color: #DFAF37; text-decoration: none;">support@thriftshopper.com</a>
              </p>
              <p style="margin: 6px 0 0; font-size: 10px; color: rgba(255,255,255,0.45);">
                &copy; 2026 ThriftShopper
              </p>
            </td>
          </tr>`.trim();
}

export function getEmailFooterText(): string {
  return `ThriftShopper
the magic of discovery™
Questions? support@thriftshopper.com
© 2026 ThriftShopper`;
}
