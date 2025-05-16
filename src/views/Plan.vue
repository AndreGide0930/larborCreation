const checkAndCreatePlan = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const today = new Date().toISOString().split('T')[0]

    // 先检查今日计划是否存在
    const checkResponse = await axios.get('http://localhost:8080/readPlanById', {
      params: {
        pkUserInfo: userInfo.pkUserInfo
      }
    })
    
    // 检查是否已存在今日计划
    const existingPlan = checkResponse.data.find((plan: any) => 
      plan.planDate.split('T')[0] === today
    )

    if (existingPlan) {
      console.log('今日计划已存在:', existingPlan)
      plans.value = checkResponse.data
      return
    }

    // 如果不存在今日计划，则创建新计划
    const payload = {
      planName: newPlan.value.planName || `${today} 的学习计划`,
      planDate: today,
      fkUserInfoId: userInfo.pkUserInfo
    }

    const createResponse = await axios.post('http://localhost:8080/createPlan', payload)
    console.log('创建计划响应:', createResponse.data)
    
    // 创建后重新获取计划列表
    const planResponse = await axios.get('http://localhost:8080/readPlanById', {
      params: {
        pkUserInfo: userInfo.pkUserInfo
      }
    })
    console.log('查询计划响应:', planResponse.data)
    plans.value = planResponse.data

    // 重置表单
    newPlan.value = {
      planName: '',
      planDate: today
    }
    showNewPlanForm.value = false

  } catch (error) {
    console.error('检查或创建计划失败:', error)
  }
}

// 替换原来的 createPlan 方法
const createPlan = checkAndCreatePlan 