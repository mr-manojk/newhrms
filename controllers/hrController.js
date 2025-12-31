const hrModel = require('../models/hrModel');

const hrController = {
  getUsers: async (req, res, next) => {
    try {
      const users = await hrModel.findAll('users');
      const safeParse = (value, fallback) => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'string') return JSON.parse(value);
        return value; // already an object/array
    };
      const parsed = users.map(u => ({
        ...u,
        emergencyContact: safeParse(u.emergencyContact, null),
        currentAddress: safeParse(u.currentAddress, null),
        permanentAddress: safeParse(u.permanentAddress, null),
        bankDetails: safeParse(u.bankDetails, null),
        notificationPreferences: safeParse(u.notificationPreferences, null),
        documents: safeParse(u.documents, []),
        certifications: safeParse(u.certifications, []),
        skills: safeParse(u.skills, []),
        languages: safeParse(u.languages, [])
      }));
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
            'highestQualification','certifications','skills','languages','totalExperience','priorExperience'
      ];
      await hrModel.bulkUpsert('users', users, columns);
      res.json({ success: true, message: 'Users synchronized' });
    } catch (err) { next(err); }
  },

  getAttendance: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('attendance');
      res.json(data);
    } catch (err) { next(err); }
  },

  bulkUpsertAttendance: async (req, res, next) => {
    try {
      const { attendance } = req.body;
      const columns = ['id', 'userId', 'date', 'checkIn', 'checkOut', 'accumulatedTime', 'location', 'latitude', 'longitude', 'lastClockIn', 'lateReason'];
      await hrModel.bulkUpsert('attendance', attendance, columns);
      res.json({ success: true, message: 'Attendance records synchronized' });
    } catch (err) { next(err); }
  },

  getLeaves: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('leaves');
      res.json(data);
    } catch (err) { next(err); }
  },

  bulkUpsertLeaves: async (req, res, next) => {
    try {
      const { leaves } = req.body;
      const columns = ['id', 'userId', 'userName', 'type', 'startDate', 'endDate', 'reason', 'status', 'appliedDate', 'processedBy', 'processedDate'];
      await hrModel.bulkUpsert('leaves', leaves, columns);
      res.json({ success: true, message: 'Leave requests synchronized' });
    } catch (err) { next(err); }
  },

  getLeaveBalances: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('leave_balances');
      res.json(data);
    } catch (err) { next(err); }
  },

  bulkUpsertBalances: async (req, res, next) => {
    try {
      const { balances } = req.body;
      const columns = ['userId', 'type', 'total', 'used'];
      await hrModel.bulkUpsert('leave_balances', balances, columns);
      res.json({ success: true, message: 'Leave balances synchronized' });
    } catch (err) { next(err); }
  },

  getHolidays: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('holidays');
      res.json(data);
    } catch (err) { next(err); }
  },

  bulkUpsertHolidays: async (req, res, next) => {
    try {
      const { holidays } = req.body;
      const columns = ['id', 'name', 'date', 'description', 'frzInd'];
      await hrModel.bulkUpsert('holidays', holidays, columns);
      res.json({ success: true, message: 'Holidays synchronized' });
    } catch (err) { next(err); }
  },

  getConfig: async (req, res, next) => {
    try {
      const data = await hrModel.findConfig();
      res.json(data);
    } catch (err) { next(err); }
  },

  saveConfig: async (req, res, next) => {
    try {
      await hrModel.saveConfig(req.body);
      res.json({ success: true, message: 'System configuration updated' });
    } catch (err) { next(err); }
  },

  getNotifications: async (req, res, next) => {
    try {
      const data = await hrModel.findAll('notifications');
      res.json(data);
    } catch (err) { next(err); }
  },

  bulkUpsertNotifications: async (req, res, next) => {
    try {
      const { notifications } = req.body;
      const columns = ['id', 'userId', 'title', 'message', 'type', 'timestamp', 'isRead'];
      await hrModel.bulkUpsert('notifications', notifications, columns);
      res.json({ success: true, message: 'Notifications synchronized' });
    } catch (err) { next(err); }
  }
};

module.exports = hrController;
