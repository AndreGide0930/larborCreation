export default {
  common: {
    add: '添加',
    edit: '编辑',
    delete: '删除',
    cancel: '取消',
    save: '保存',
    confirm: '确认',
    loading: '加载中...',
    error: '错误',
    success: '成功'
  },
  auth: {
    login: '登录',
    register: '注册',
    logout: '退出登录',
    email: '邮箱',
    username: '用户名',
    verificationCode: '验证码',
    sendCode: '发送验证码',
    verify: '验证',
    resend: '重新发送',
    createAccount: '创建账号',
    alreadyHaveAccount: '已有账号？',
    dontHaveAccount: '还没有账号？',
    loginNow: '立即登录',
    registerNow: '立即注册'
  },
  profile: {
    title: '个人中心',
    username: '用户名',
    email: '邮箱',
    phone: '电话',
    darkMode: '深色模式',
    systemSettings: '系统设置',
    language: '语言',
    editProfile: '编辑资料',
    save: '保存修改',
    saving: '保存中...',
    cancel: '取消',
    logout: '退出登录',
    uploadAvatar: '上传头像',
    uploading: '上传中...',
    messages: {
      updateSuccess: '个人信息更新成功',
      updateFailed: '更新失败，请稍后重试',
      getUserFailed: '获取用户信息失败',
      avatarSuccess: '头像上传成功',
      avatarFailed: '头像上传失败',
      selectImage: '请选择图片文件',
      imageTooLarge: '图片大小不能超过 2MB',
      usernameRequired: '请输入用户名',
      invalidEmail: '请输入有效的邮箱地址',
      invalidPhone: '请输入有效的手机号码'
    }
  },
  tasks: {
    title: '任务管理',
    subtitle: '使用四象限法则管理你的任务',
    addTask: '添加任务',
    taskTitle: '标题',
    priority: '优先级',
    description: '描述',
    urgent: {
      important: '重要且紧急',
      notImportant: '不重要但紧急'
    },
    notUrgent: {
      important: '重要不紧急',
      notImportant: '不重要不紧急'
    },
    status: {
      todo: '待办',
      done: '已完成'
    },
    actions: {
      focus: '专注',
      complete: '完成',
      update: '更新',
      delete: '删除'
    }
  },
  schedule: {
    title: '日程安排',
    subtitle: '高效规划你的学习时间',
    today: '今天',
    createPlan: '创建计划',
    editTimeBlock: '编辑时间块',
    addTask: '添加任务',
    timeBlock: {
      time: '时间段',
      start: '开始时间',
      end: '结束时间',
      tasks: '关联任务',
      stats: '任务统计',
      addTasks: '添加任务',
      removeTasks: '移除任务',
      markDone: '标记完成',
      noTasks: '暂无任务',
      createBlock: '创建时间块'
    },
    reminder: {
      selectTime: '选择提醒时间',
      timeRequired: '请选择提醒时间',
      scheduleSuccess: '提醒设置成功',
      scheduleFailed: '提醒设置失败',
      scheduling: '正在设置...',
      schedule: '设置提醒'
    },
    messages: {
      createSuccess: '创建时间块成功',
      createFailed: '创建时间块失败',
      updateSuccess: '更新时间块成功',
      updateFailed: '更新时间块失败',
      deleteSuccess: '删除时间块成功',
      deleteFailed: '删除时间块失败'
    }
  },
  pomodoro: {
    title: '专注车间',
    timer: {
      start: '开始',
      pause: '暂停',
      reset: '重置',
      complete: '提前完成',
      exit: '退出'
    },
    currentTasks: '当前任务',
    noTasks: '没有正在进行的任务'
  },
  analysis: {
    title: '学习效果分析',
    subtitle: '深入了解你的学习表现',
    selectPlan: '选择计划',
    selectTimeBlock: '选择时间块',
    analyzePlan: '分析计划',
    analyzeTimeBlock: '分析时间块',
    result: '分析结果',
    trend: '学习趋势',
    score: '得分',
    noData: '暂无数据'
  },
  portfolio: {
    title: '我的作品集',
    addWork: '添加作品',
    search: '搜索',
    clear: '清除',
    upload: {
      title: '上传新作品',
      selectFile: '选择文件',
      priority: '优先级',
      description: '描述'
    },
    fileTypes: {
      pdf: 'PDF文档',
      image: '图片',
      video: '视频',
      doc: 'Word文档',
      excel: 'Excel表格'
    }
  }
}