'use strict';
const db = uniCloud.database()

exports.main = async (event, context) => {
  const { userId, nickname, avatar, bio } = event
  
  if (!userId) {
    return { code: -1, message: '用户ID不能为空' }
  }

  try {
    const res = await db.collection('users').doc(userId).update({
      nickname: nickname,
      avatar: avatar,
      bio: bio
    })

    if (res.updated === 1 || res.updated === 0) {
      return { code: 0, message: '更新成功' }
    } else {
      return { code: -1, message: '更新失败' }
    }
  } catch (e) {
    return { code: -500, message: e.message }
  }
};
