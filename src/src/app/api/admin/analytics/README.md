# Admin: Analytics endpoint

This endpoint returns top site paths and counts. For the premium audit we return a safe mocked payload so the dashboard always shows activity in buyers' previews.

GET /api/admin/analytics
Response: { visits: [{ path: string, count: number }] }
