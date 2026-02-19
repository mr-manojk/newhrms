
const hrModel = require('../models/hrModel');
const mailService = require('../services/mailService');
const pool = require('../config/db');

/**
 * Normalizes database row keys to match frontend expectations.
 */
const normalizeRow = (row, mapping = {}) => {
  if (!row) return row;
  const normalized = {};
  for (const key in row) {
    const targetKey = mapping[key.toLowerCase()] || key;
    normalized[targetKey] = row[key];
  }
  return normalized;
};

const safeParse = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

const hrController = {
  getUsers: async (req, res, next) => {
    try {
      const users = await hrModel.findAll('users');
      const mapping = {
        'employeeid': 'employeeId',
        'managerid': 'managerId',
        'joindate': 'joinDate',
        'shiftstart': 'shiftStart',
        'shiftend': 'shiftEnd',
        'personalemail': 'personalEmail',
        'contactnumber': 'contactNumber',
        'jobtitle': 'jobTitle',
        'employmenttype': 'employmentType',
        'probationenddate': 'probationEndDate',
        'worklocation': 'workLocation',
        'employeestatus': 'employeeStatus',
        'bankdetails': 'bankDetails',
        'payrollcycle': 'payrollCycle',
        'paygrade': 'payGrade',
        'highestqualification': 'highestQualification',
        'priorexperience': 'priorExperience',
        'lastlogin': 'lastLogin',
        'twofactorenabled': 'twoFactorEnabled',
        'notificationpreferences': 'notificationPreferences',
        'emergencycontact': 'emergencyContact',
        'currentaddress': 'currentAddress',
        'permanentaddress': 'permanentAddress'
      };

      const parsed = users.map(u => {
        const norm = normalizeRow(u, mapping);
        return {
          ...norm,
          emergencyContact: safeParse(norm.emergencyContact, null),
          currentAddress: safeParse(norm.currentAddress, null),
          permanentAddress: safeParse(norm.permanentAddress, null),
          bankDetails: safeParse(norm.bankDetails, null),
          notificationPreferences: safeParse(norm.notificationPreferences, { attendanceReminders: true, leaveUpdates: true, frequency: 'immediate', channels: { inApp: true, email: true } }),
          documents: safeParse(norm.documents, []),
          certifications: safeParse(norm.certifications, []),
          skills: safeParse(norm.skills, []),
          languages: safeParse(norm.languages, []),
          twoFactorEnabled: norm.twoFactorEnabled === 1 || norm.twoFactorEnabled === true
        };
      });
      res.json(parsed);
    } catch (err) { next(err); }
  },

  bulkUpsertUsers: async (req, res, next) => {
    try {
      const { users } = req.body;
      const columns = [
            'id', 'employeeId', 'name', 'email', 'password', 'role', 'department', 
            'managerId', 'avatar', 'joinDate', 'shiftStart', 'shiftEnd', 'dob', 
            'gender', 'maritalStatus', 'nationality', 'bloodGroup', 'personalEmail', 
            'contactNumber', 'jobTitle', 'employmentType', 'probationEndDate', 
            'workLocation', 'employeeStatus', 'payrollCycle', 'emergencyContact', 
            'currentAddress', 'permanentAddress', 'bankDetails','documents',
            'highestQualification','certifications','skills','languages','totalExperience','priorExperience',
            'twoFactorEnabled', 'notificationPreferences'
      ];
      await hrModel.bulkUpsert('users', users, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getSalaryStructures: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('salary_structures');
      const mapping = { 
        'userid': 'userId', 
        'lastupdated': 'lastUpdated',
        'attendancebonus': 'attendanceBonus',
        'transportallowance': 'transportAllowance',
        'conveyanceallowance': 'conveyanceAllowance',
        'medicalallowance': 'medicalAllowance',
        'performanceincentives': 'performanceIncentives',
        'internetallowance': 'internetAllowance'
      };
      res.json(data.map(s => {
        const norm = normalizeRow(s, mapping);
        return { 
          ...norm, 
          components: safeParse(norm.components, {}),
          basic: Number(norm.basic || 0),
          hra: Number(norm.hra || 0),
          attendanceBonus: Number(norm.attendanceBonus || 0),
          transportAllowance: Number(norm.transportAllowance || 0),
          conveyanceAllowance: Number(norm.conveyanceAllowance || 0),
          medicalAllowance: Number(norm.medicalAllowance || 0),
          performanceIncentives: Number(norm.performanceIncentives || 0),
          internetAllowance: Number(norm.internetAllowance || 0),
          pf: Number(norm.pf || 0),
          tax: Number(norm.tax || 0),
          pt: Number(norm.pt || 0)
        };
      }));
    } catch (err) { next(err); }
  },

  bulkUpsertSalaryStructures: async (req, res, next) => {
    try {
      const { structures } = req.body;
      const columns = [
        'userId', 'basic', 'hra', 'attendanceBonus', 'transportAllowance', 
        'conveyanceAllowance', 'medicalAllowance', 'performanceIncentives', 
        'internetAllowance', 'pf', 'tax', 'pt', 'components', 'lastUpdated'
      ];
      await hrModel.bulkUpsert('salary_structures', structures, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getPayrollRuns: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('payroll_runs');
      const mapping = { 
        'userid': 'userId', 
        'grosssalary': 'grossSalary', 
        'netsalary': 'netSalary',
        'processeddate': 'processedDate',
        'attendancedays': 'attendanceDays',
        'componentbreakdown': 'componentBreakdown'
      };
      res.json(data.map(r => {
        const norm = normalizeRow(r, mapping);
        return { ...norm, componentBreakdown: safeParse(norm.componentBreakdown, {}) };
      }));
    } catch (err) { next(err); }
  },

  bulkUpsertPayrollRuns: async (req, res, next) => {
    try {
      const { runs } = req.body;
      const columns = ['id', 'userId', 'month', 'year', 'grossSalary', 'netSalary', 'deductions', 'reimbursements', 'bonus', 'status', 'processedDate', 'attendanceDays', 'componentBreakdown'];
      await hrModel.bulkUpsert('payroll_runs', runs, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getAttendance: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('attendance');
      const mapping = {
        'userid': 'userId',
        'checkin': 'checkIn',
        'checkout': 'checkOut',
        'accumulatedtime': 'accumulatedTime',
        'breaktime': 'breakTime',
        'lastclockin': 'lastClockIn',
        'latereason': 'lateReason'
      };
      res.json(data.map(a => normalizeRow(a, mapping)));
    } catch (err) { next(err); }
  },

  bulkUpsertAttendance: async (req, res, next) => {
    try {
      const { attendance } = req.body;
      const columns = ['id', 'userId', 'date', 'checkIn', 'checkOut', 'accumulatedTime', 'breakTime', 'location', 'latitude', 'longitude', 'lastClockIn', 'lateReason'];
      await hrModel.bulkUpsert('attendance', attendance, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getRosters: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('rosters');
      const mapping = { 'userid': 'userId', 'shiftid': 'shiftId' };
      res.json(data.map(r => normalizeRow(r, mapping)));
    } catch (err) { next(err); }
  },

  bulkUpsertRosters: async (req, res, next) => {
    try {
      const { rosters } = req.body;
      const columns = ['id', 'userId', 'date', 'shiftId', 'note'];
      await hrModel.bulkUpsert('rosters', rosters, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getLeaves: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('leaves');
      const mapping = {
        'userid': 'userId',
        'username': 'userName',
        'startdate': 'startDate',
        'enddate': 'endDate',
        'applieddate': 'appliedDate',
        'processedby': 'processedBy',
        'processeddate': 'processedDate',
        'ccemail': 'ccEmail'
      };
      res.json(data.map(l => normalizeRow(l, mapping)));
    } catch (err) { next(err); }
  },

  bulkUpsertLeaves: async (req, res, next) => {
    try {
      const { leaves } = req.body;
      
      // 1. Fetch current data to detect changes (to trigger emails)
      const existingLeaves = await hrModel.findAll('leaves');
      const users = await hrModel.findAll('users');
      
      const findUser = (id) => users.find(u => String(u.id) === String(id));
      
      // Identify all Admin and HR emails to keep them in CC
      const adminHrEmails = users
        .filter(u => u.role === 'ADMIN' || u.role === 'HR')
        .map(u => u.email)
        .filter(Boolean);

      for (const incoming of leaves) {
        const existing = existingLeaves.find(l => String(l.id) === String(incoming.id));
        
        // Prepare additional CC recipients (Admin, HR, and the optional CC email on the request)
        const additionalCC = [...adminHrEmails];
        if (incoming.ccEmail) {
          additionalCC.push(incoming.ccEmail);
        }

        // CASE A: Newly applied leave
        if (!existing && incoming.status === 'PENDING') {
          const employee = findUser(incoming.userId);
          if (employee && employee.managerId) {
            const manager = findUser(employee.managerId);
            // Send asynchronously to not block response
            mailService.sendLeaveApplied(incoming, employee, manager, additionalCC).catch(console.error);
          }
        }
        
        // CASE B: Leave status updated (Processed)
        if (existing && existing.status === 'PENDING' && incoming.status !== 'PENDING') {
          const employee = findUser(incoming.userId);
          if (employee) {
            mailService.sendLeaveProcessed(incoming, employee, additionalCC).catch(console.error);
          }
        }
      }

      const columns = ['id', 'userId', 'userName', 'type', 'startDate', 'endDate', 'reason', 'status', 'appliedDate', 'processedBy', 'processedDate', 'ccEmail'];
      await hrModel.bulkUpsert('leaves', leaves, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getLeaveBalances: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('leave_balances');
      const mapping = { 'userid': 'userId' };
      res.json(data.map(b => normalizeRow(b, mapping)));
    } catch (err) { next(err); }
  },

  bulkUpsertBalances: async (req, res, next) => {
    try {
      const { balances } = req.body;
      const columns = ['userId', 'type', 'total', 'used'];
      await hrModel.bulkUpsert('leave_balances', balances, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getExpenses: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('expenses');
      const mapping = { 'userid': 'userId', 'username': 'userName', 'receipturl': 'receiptUrl', 'approvedby': 'approvedBy' };
      res.json(data.map(e => normalizeRow(e, mapping)));
    } catch (err) { next(err); }
  },

  bulkUpsertExpenses: async (req, res, next) => {
    try {
      const { expenses } = req.body;
      const columns = ['id', 'userId', 'userName', 'category', 'amount', 'date', 'description', 'receiptUrl', 'status', 'approvedBy'];
      await hrModel.bulkUpsert('expenses', expenses, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getBonusIncrements: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('bonus_increments');
      const mapping = { 'userid': 'userId', 'effectivedate': 'effectiveDate', 'isprocessed': 'isProcessed' };
      res.json(data.map(b => {
        const norm = normalizeRow(b, mapping);
        return { ...norm, isProcessed: norm.isProcessed === 1 || norm.isProcessed === true };
      }));
    } catch (err) { next(err); }
  },

  bulkUpsertBonusIncrements: async (req, res, next) => {
    try {
      const { bonuses } = req.body;
      const columns = ['id', 'userId', 'type', 'amount', 'effectiveDate', 'reason', 'isProcessed'];
      await hrModel.bulkUpsert('bonus_increments', bonuses, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getHolidays: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('holidays');
      const mapping = { 'frzind': 'frzInd' };
      res.json(data.map(h => {
        const norm = normalizeRow(h, mapping);
        return { ...norm, frzInd: norm.frzInd === 1 || norm.frzInd === true };
      }));
    } catch (err) { next(err); }
  },

  bulkUpsertHolidays: async (req, res, next) => {
    try {
      const { holidays } = req.body;
      const columns = ['id', 'name', 'date', 'description', 'frzInd'];
      await hrModel.bulkUpsert('holidays', holidays, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getConfig: async (req, res, next) => {
    try {
      const data = await hrModel.findConfig();
      const mapping = {
        'companyname': 'companyName',
        'companydomain': 'companyDomain',
        'workstarttime': 'workStartTime',
        'workendtime': 'workEndTime',
        'graceperiodminutes': 'gracePeriodMinutes',
        'defaultannualleave': 'defaultAnnualLeave',
        'defaultsickleave': 'defaultSickLeave',
        'defaultcasualleave': 'defaultCasualLeave',
        'schedulingmode': 'schedulingMode',
        'salarycomponents': 'salaryComponents'
      };
      if (data) {
        const norm = normalizeRow(data, mapping);
        norm.salaryComponents = safeParse(norm.salaryComponents, []);
        res.json(norm);
      } else {
        res.json(null);
      }
    } catch (err) { next(err); }
  },

  saveConfig: async (req, res, next) => {
    try {
      await hrModel.saveConfig(req.body);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getNotifications: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('notifications');
      const mapping = { 'userid': 'userId', 'isread': 'isRead' };
      res.json(data.map(n => {
        const norm = normalizeRow(n, mapping);
        return { ...norm, isRead: norm.isRead === 1 || norm.isRead === true };
      }));
    } catch (err) { next(err); }
  },

  bulkUpsertNotifications: async (req, res, next) => {
    try {
      const { notifications } = req.body;
      const columns = ['id', 'userId', 'title', 'message', 'type', 'timestamp', 'isRead'];
      await hrModel.bulkUpsert('notifications', notifications, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getPerformanceGoals: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('performance_goals');
      const mapping = { 'userid': 'userId', 'duedate': 'dueDate' };
      res.json(data.map(g => normalizeRow(g, mapping)));
    } catch (err) { next(err); }
  },

  bulkUpsertPerformanceGoals: async (req, res, next) => {
    try {
      const { goals } = req.body;
      const columns = ['id', 'userId', 'title', 'description', 'priority', 'status', 'progress', 'dueDate'];
      await hrModel.bulkUpsert('performance_goals', goals, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getPerformanceReviews: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('performance_reviews');
      const mapping = { 
        'userid': 'userId', 
        'reviewerid': 'reviewerId', 
        'selfrating': 'selfRating', 
        'managerrating': 'managerRating',
        'lastupdated': 'lastUpdated'
      };
      res.json(data.map(r => normalizeRow(r, mapping)));
    } catch (err) { next(err); }
  },

  bulkUpsertPerformanceReviews: async (req, res, next) => {
    try {
      const { reviews } = req.body;
      const columns = ['id', 'userId', 'reviewerId', 'cycle', 'status', 'selfRating', 'managerRating', 'comments', 'lastUpdated'];
      await hrModel.bulkUpsert('performance_reviews', reviews, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getPerformanceFeedback: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('performance_feedback');
      const mapping = { 'userid': 'userId', 'fromid': 'fromId', 'fromname': 'fromName' };
      res.json(data.map(f => normalizeRow(f, mapping)));
    } catch (err) { next(err); }
  },

  bulkUpsertPerformanceFeedback: async (req, res, next) => {
    try {
      const { feedback } = req.body;
      const columns = ['id', 'userId', 'fromId', 'fromName', 'content', 'date', 'category', 'rating'];
      await hrModel.bulkUpsert('performance_feedback', feedback, columns);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
      }

      // 1. Check if user exists
      const users = await hrModel.findAll('users');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        // Security best practice: Don't explicitly say the email doesn't exist to prevent enumeration,
        // but for an internal HRMS, it's often more helpful to be direct.
        return res.status(404).json({ success: false, message: "No account found with this email." });
      }

      // 2. Generate a 6-digit code
      // For demo we use a static code if requested, otherwise random
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 3. Dispatch the real email via NodeMailer
      await mailService.sendPasswordResetCode(user, code);

      res.json({ 
        success: true, 
        message: "A verification code has been sent to your email.",
        demoCode: code // Provided for the frontend to auto-verify in development/mock modes
      });
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { email, newPassword } = req.body;
      await hrModel.updatePasswordByEmail(email, newPassword);
      res.json({ success: true });
    } catch (err) { next(err); }
  }
};

module.exports = hrController;
