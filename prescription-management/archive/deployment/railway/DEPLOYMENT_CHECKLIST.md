# Deployment Checklist

Use this checklist to ensure all steps are completed before and after deployment.

## Pre-Deployment Checklist

### Code Preparation
- [ ] All code committed to Git
- [ ] No sensitive data in code (passwords, API keys)
- [ ] `.env` files added to `.gitignore`
- [ ] Dependencies up to date (`npm install`, `pip install`)
- [ ] Local build successful (`npm run build`)
- [ ] Local tests passing
- [ ] No console errors in development

### Environment Configuration
- [ ] Created `.env.production` for frontend
- [ ] Generated secure SECRET_KEY (32+ characters)
- [ ] Generated secure JWT_SECRET_KEY (32+ characters)
- [ ] Documented all required environment variables
- [ ] Backend CORS configured for production domain

### Database Preparation
- [ ] Database schema ready (`init.sql` or migrations)
- [ ] Test data available for initial setup
- [ ] Backup strategy planned
- [ ] Database credentials secured

### Accounts Setup
- [ ] GitHub account ready
- [ ] Vercel account created
- [ ] Backend hosting account created (Railway/Render)
- [ ] Database hosting account created (if separate)

---

## Deployment Checklist

### Frontend Deployment (Vercel)
- [ ] Repository pushed to GitHub
- [ ] Project imported to Vercel
- [ ] Root directory set to `frontend`
- [ ] Build command verified: `npm run build`
- [ ] Output directory verified: `dist`
- [ ] Environment variable `VITE_API_URL` configured
- [ ] Deployment successful
- [ ] Frontend URL obtained
- [ ] Custom domain configured (if applicable)

### Backend Deployment (Railway/Render)
- [ ] Project created in hosting platform
- [ ] PostgreSQL database provisioned
- [ ] Root directory set to `backend`
- [ ] Start command configured: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Environment variables configured:
  - [ ] `DATABASE_URL`
  - [ ] `SECRET_KEY`
  - [ ] `JWT_SECRET_KEY`
  - [ ] `ENVIRONMENT=production`
  - [ ] `ALLOWED_ORIGINS` (with Vercel URL)
- [ ] Deployment successful
- [ ] Backend URL obtained
- [ ] Health endpoint accessible

### Database Setup
- [ ] Database created
- [ ] Connection string obtained
- [ ] Schema/migrations run
- [ ] Tables created successfully
- [ ] Initial admin user created
- [ ] Connection tested from backend

### Integration
- [ ] Frontend `VITE_API_URL` updated with backend URL
- [ ] Backend `ALLOWED_ORIGINS` updated with frontend URL
- [ ] Both services redeployed after URL updates
- [ ] CORS working (no errors in browser console)

---

## Post-Deployment Testing

### Health Checks
- [ ] Backend health endpoint responds: `curl https://backend.com/api/v1/health`
- [ ] Frontend loads without errors
- [ ] No console errors in browser (F12 → Console)
- [ ] No network errors in DevTools (F12 → Network)

### Authentication Flow
- [ ] Registration page accessible
- [ ] Can create new user
- [ ] Login page accessible
- [ ] Can login with credentials
- [ ] JWT token stored correctly
- [ ] Auto-logout works after token expiry
- [ ] Protected routes redirect to login when not authenticated

### Core Functionality
- [ ] Admin dashboard loads
- [ ] Can create doctor
- [ ] Can create patient
- [ ] Can book appointment
- [ ] Can create prescription
- [ ] Can view prescription
- [ ] Dental features work (for dental doctors)

### Data Validation
- [ ] Form validations working
- [ ] API error messages displayed correctly
- [ ] Date pickers work properly
- [ ] Dropdown selections work
- [ ] File uploads work (if applicable)

### Performance
- [ ] Page load time acceptable (<3 seconds)
- [ ] API response time acceptable (<1 second)
- [ ] Images/assets load correctly
- [ ] No memory leaks in frontend
- [ ] Database queries optimized

---

## Security Checklist

### Credentials & Keys
- [ ] All default passwords changed
- [ ] Production SECRET_KEY different from development
- [ ] Production JWT_SECRET_KEY different from development
- [ ] Database password strong and unique
- [ ] API keys stored securely in environment variables
- [ ] No hardcoded secrets in code

### Access Control
- [ ] CORS configured (not using wildcard `*` in production)
- [ ] JWT token expiration configured (30 minutes access, 7 days refresh)
- [ ] Role-based access control working
- [ ] Protected routes require authentication
- [ ] Admin routes require admin role

### Network Security
- [ ] HTTPS enabled (automatic with Vercel/Railway)
- [ ] Database not publicly accessible (private network only)
- [ ] API rate limiting planned (future enhancement)
- [ ] Security headers configured

### Data Protection
- [ ] Passwords hashed (bcrypt)
- [ ] Sensitive data encrypted in database
- [ ] SQL injection prevention (using ORM)
- [ ] XSS prevention (React auto-escapes)
- [ ] CSRF protection considered

---

## Monitoring Setup

### Logging
- [ ] Backend logging configured
- [ ] Frontend error logging setup
- [ ] Log retention policy defined
- [ ] Access logs enabled

### Monitoring Tools
- [ ] Vercel Analytics enabled
- [ ] Backend monitoring setup (Railway logs)
- [ ] Database monitoring enabled
- [ ] Uptime monitoring configured (optional)
- [ ] Error tracking setup (Sentry - optional)

### Alerts
- [ ] Email notifications for critical errors (optional)
- [ ] Database backup alerts configured
- [ ] Uptime alerts configured (optional)

---

## Backup & Recovery

### Backup Strategy
- [ ] Database backup frequency defined (daily/weekly)
- [ ] Backup storage location configured
- [ ] Backup retention policy defined
- [ ] Test restoration process documented

### Disaster Recovery
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined
- [ ] Disaster recovery plan documented
- [ ] Backup restoration tested

---

## Documentation

### User Documentation
- [ ] User guide created (optional)
- [ ] API documentation accessible (FastAPI /docs)
- [ ] README updated with deployment info
- [ ] Environment variables documented

### Developer Documentation
- [ ] Deployment guide completed
- [ ] Architecture diagram created
- [ ] Code comments reviewed
- [ ] Contribution guidelines created (if open source)

---

## Performance Optimization

### Frontend
- [ ] Code splitting enabled (Vite default)
- [ ] Lazy loading implemented for routes
- [ ] Images optimized
- [ ] Bundle size acceptable (<1MB)
- [ ] Lighthouse score checked (>90)

### Backend
- [ ] Database indexes created
- [ ] Query optimization done
- [ ] Connection pooling configured
- [ ] Caching strategy considered

---

## Compliance & Legal

### Data Privacy
- [ ] GDPR compliance reviewed (if applicable)
- [ ] HIPAA compliance reviewed (medical data)
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Cookie policy created (if using cookies)

### Medical Compliance
- [ ] Medical data encryption verified
- [ ] Audit logging implemented
- [ ] Patient data access controls verified
- [ ] Data retention policies defined

---

## Launch Preparation

### Stakeholder Communication
- [ ] Deployment plan shared with team
- [ ] Downtime window communicated (if any)
- [ ] Rollback plan prepared
- [ ] Support team briefed

### Go-Live
- [ ] DNS changes made (if custom domain)
- [ ] SSL certificates verified
- [ ] Final smoke tests completed
- [ ] Monitoring dashboards open
- [ ] Support team on standby

---

## Post-Launch

### First 24 Hours
- [ ] Monitor logs continuously
- [ ] Check error rates
- [ ] Verify user registrations working
- [ ] Check system performance
- [ ] Respond to any issues immediately

### First Week
- [ ] Gather user feedback
- [ ] Monitor system performance trends
- [ ] Check database growth
- [ ] Review error logs daily
- [ ] Address any bugs found

### First Month
- [ ] Analyze usage patterns
- [ ] Optimize based on actual usage
- [ ] Plan feature enhancements
- [ ] Review security logs
- [ ] Evaluate hosting costs

---

## Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Check database performance

### Weekly
- [ ] Review analytics
- [ ] Check backup status
- [ ] Update dependencies (if needed)
- [ ] Review security alerts

### Monthly
- [ ] Performance review
- [ ] Cost analysis
- [ ] Security audit
- [ ] Database optimization
- [ ] Dependency updates

---

## Rollback Plan

### If Deployment Fails

**Frontend**:
1. Vercel auto-keeps previous deployment
2. Go to Deployments → Select previous working deployment
3. Click "Promote to Production"

**Backend**:
1. Railway keeps deployment history
2. Go to Deployments → Select previous version
3. Click "Redeploy"

**Database**:
1. If migrations fail, restore from backup:
   ```bash
   psql DATABASE_URL < backup.sql
   ```

### Emergency Contacts
- [ ] DevOps lead: _________________
- [ ] Database admin: _________________
- [ ] Backend developer: _________________
- [ ] Frontend developer: _________________

---

## Sign-Off

### Deployment Team

- [ ] Frontend Developer: _____________ Date: _______
- [ ] Backend Developer: _____________ Date: _______
- [ ] Database Admin: _____________ Date: _______
- [ ] DevOps Engineer: _____________ Date: _______
- [ ] Project Manager: _____________ Date: _______

### Stakeholder Approval

- [ ] Product Owner: _____________ Date: _______
- [ ] Technical Lead: _____________ Date: _______
- [ ] Security Officer: _____________ Date: _______ (if applicable)

---

## Notes

Use this section to document any deployment-specific information:

```
Deployment Date: _______________
Frontend URL: _______________
Backend URL: _______________
Database Host: _______________

Issues Encountered:
-
-
-

Resolutions:
-
-
-

Follow-up Actions:
-
-
-
```

---

**Deployment Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed
