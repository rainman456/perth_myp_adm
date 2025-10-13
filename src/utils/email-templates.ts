// Email template functions

export const applicationApprovedTemplate = (
  storeName: string,
  email: string,
  tempPassword: string,
  loginUrl: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
        .credentials { background: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Application Approved!</h1>
        </div>
        <div class="content">
          <h2>Welcome, ${storeName}!</h2>
          <p>Your merchant application has been approved. You can now start selling on our platform.</p>
          
          <div class="credentials">
            <h3>Your Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p><em>Please change your password after first login</em></p>
          </div>
          
          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Dashboard</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const applicationRejectedTemplate = (
  name: string,
  reason: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Status Update</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Thank you for your interest in becoming a merchant on our platform.</p>
          <p>Unfortunately, we are unable to approve your application at this time.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const moreInfoRequestTemplate = (
  name: string,
  message: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Additional Information Required</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>We are reviewing your merchant application and need some additional information:</p>
          <p><strong>${message}</strong></p>
          <p>Please provide the requested information to continue with your application.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const payoutInitiatedTemplate = (
  storeName: string,
  amount: number | string,
  date: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Payout Initiated</h1>
        </div>
        <div class="content">
          <p>Dear ${storeName},</p>
          <p>Your payout has been initiated and is being processed.</p>
          <p><strong>Amount:</strong> ₦${amount}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p>The funds should arrive in your account within 1-3 business days.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const payoutCompletedTemplate = (
  storeName: string,
  amount: number | string,
  reference?: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payout Completed</h1>
        </div>
        <div class="content">
          <p>Dear ${storeName},</p>
          <p>Your payout has been successfully completed!</p>
          <p><strong>Amount:</strong> ₦${amount}</p>
          <p>The funds have been transferred to your registered account.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const payoutFailedTemplate = (
  storeName: string,
  amount: number | string,
  reason: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Payout Failed</h1>
        </div>
        <div class="content">
          <p>Dear ${storeName},</p>
          <p>Unfortunately, your payout could not be processed.</p>
          <p><strong>Amount:</strong> ₦${amount}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please contact support for assistance.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const merchantSuspendedTemplate = (
  storeName: string,
  reason: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Account Suspended</h1>
        </div>
        <div class="content">
          <p>Dear ${storeName},</p>
          <p>Your merchant account has been suspended.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please contact our support team for more information.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const weeklyPayoutSummaryTemplate = (
  storeName: string,
  weekStart: string,
  weekEnd: string,
  totalSales: number,
  commission: number,
  netPayout: number,
  ordersCount: number
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #9C27B0; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #9C27B0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Weekly Payout Summary</h1>
        </div>
        <div class="content">
          <p>Dear ${storeName},</p>
          <p>Here's your weekly payout summary for ${weekStart} to ${weekEnd}:</p>
          <div class="stats">
            <div class="stat">
              <div class="stat-value">₦${totalSales}</div>
              <div>Total Sales</div>
            </div>
            <div class="stat">
              <div class="stat-value">₦${commission}</div>
              <div>Commission</div>
            </div>
            <div class="stat">
              <div class="stat-value">₦${netPayout}</div>
              <div>Net Payout</div>
            </div>
            <div class="stat">
              <div class="stat-value">${ordersCount}</div>
              <div>Orders</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
