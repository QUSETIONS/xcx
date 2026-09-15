export const COOPERATION_NOTICE = '以下为开放招募方向与意向线索；正式合作、官方合作或投资项目均须经平台审核及双方书面确认。'

export const COOPERATION_CATEGORIES = [
  { id: 'capital', code: '01', label: '金融与资本', shortLabel: '资本' },
  { id: 'brand', code: '02', label: '品牌与企业展示', shortLabel: '品牌' },
  { id: 'venue', code: '03', label: '高端生活与线下场景', shortLabel: '场景' },
  { id: 'health', code: '04', label: '健康与生活方式', shortLabel: '健康' },
  { id: 'network', code: '05', label: '组织与产业网络', shortLabel: '组织' },
  { id: 'project', code: '06', label: '内容与项目合作', shortLabel: '项目' }
]

const ICONS = {
  capital: '/static/icons/shield.svg',
  brand: '/static/icons/star.svg',
  venue: '/static/icons/home.svg',
  health: '/static/icons/heart.svg',
  network: '/static/icons/users.svg',
  project: '/static/icons/handshake.svg'
}

const RAW_CATALOG = [
  ['capital-finance-club', 'capital', '金融俱乐部', 'open', '连接金融从业者、企业主与项目方，建立长期项目交流和资源转介机制。', '欢迎金融顾问、券商、银行、基金服务机构及有真实项目资源的伙伴参与共建。', '全国|上海', '金融资源|项目交流|资源转介'],
  ['capital-listed-club', 'capital', '上市俱乐部（待定）', 'pending', '面向上市公司、拟上市企业及专业服务机构的高质量交流方向。', '当前处于合作方案和准入机制确认阶段，适合先提交机构介绍与合作设想。', '全国', '上市公司|拟上市|专业服务'],
  ['capital-private-placement', 'capital', '私募机构入驻位置', 'open', '为私募机构、基金管理人及投资顾问预留机构展示和项目合作位置。', '可围绕机构展示、项目推介、产业资源对接和合规沟通提交入驻意向。', '全国|上海|北京|深圳', '私募机构|机构入驻|项目推介'],
  ['capital-investment-company', 'capital', '投资公司合作', 'open', '招募投资公司、产业资本和财务顾问参与项目筛选与联合推进。', '欢迎补充机构方向、投资阶段、区域偏好及可提供的合作资源。', '全国', '投资公司|产业资本|联合投资'],
  ['brand-enterprise-display', 'brand', '企业展示区', 'open', '为优质企业提供品牌展示、业务介绍和合作线索承接的位置。', '适合有品牌故事、代表性产品或产业能力的企业申请展示。', '线上|上海', '企业展示|品牌曝光|合作线索'],
  ['brand-official', 'brand', '官方合作', 'open', '探索平台与机构、园区、媒体和专业服务方的联合运营合作。', '合作形式可包括联合活动、内容共创、资源互荐和项目协同，具体以评估结果为准。', '全国', '联合运营|资源互荐|活动共建'],
  ['brand-cooperation', 'brand', '品牌合作', 'open', '面向品牌方开放场景联动、内容共创、客户触达与异业合作机会。', '欢迎提交品牌定位、目标人群、合作预算和期望场景，便于快速匹配。', '全国|上海', '品牌联动|内容共创|异业合作'],
  ['venue-golf-club', 'venue', '高尔夫俱乐部合作', 'open', '寻找高尔夫俱乐部、赛事主办方和会员组织，共建高质量线下交流场景。', '可合作举办闭门交流、项目路演、会员权益和品牌活动。', '全国|上海', '高尔夫|会员活动|闭门交流'],
  ['venue-yacht-club', 'venue', '游艇俱乐部合作', 'open', '探索游艇俱乐部及高端生活方式组织的会员互通与项目合作。', '欢迎提交场地、会员结构、活动档期和可提供的合作权益。', '上海|三亚|深圳', '游艇|高端生活|会员互通'],
  ['venue-jingan-underground-mall', 'venue', '静安区地下商城（意向场地）', 'pending', '围绕线下展示、快闪活动和品牌体验，推进静安区地下商城场景合作方向。', '场地档期、面积和具体合作方式仍需逐项确认，当前开放资源方提交意向。', '上海 · 静安', '线下场地|快闪展示|意向洽谈'],
  ['venue-kerry-center', 'venue', '嘉里中心（意向场地）', 'pending', '探索面向品牌展示、商务交流和高端活动的城市商业体合作方向。', '具体场地与合作权益以现场评估和对方确认信息为准。', '上海', '商业体|商务交流|意向洽谈'],
  ['venue-property-hotel', 'venue', '房产酒店线下合作方向', 'pending', '寻找房产、酒店及城市综合体合作方，拓展展示、活动和客户触达场景。', '保利、万科等方向仅作为用户提供的意向线索，尚未标记为已合作伙伴。', '全国|上海', '房产酒店|保利 / 万科等方向|线下场景'],
  ['health-gym', 'health', '健身房合作', 'open', '连接健身房、运动空间和企业健康服务，探索会员互导与品牌联动。', '适合门店展示、团体活动、企业福利和健康项目合作。', '全国', '健身房|运动健康|会员互导'],
  ['health-beauty', 'health', '美容院合作', 'open', '寻找美容院、美学机构和生活方式品牌，建立线下体验与客户合作网络。', '欢迎提交门店规模、服务特色、客群和可开放的合作权益。', '全国|上海', '美容院|生活方式|客户合作'],
  ['health-care', 'health', '康养机构合作', 'open', '面向康养社区、养老机构和健康管理机构开放资源合作。', '合作方向包括渠道互荐、健康活动、会员服务和项目落地。', '全国', '康养机构|健康管理|渠道互荐'],
  ['health-medical', 'health', '医疗资源合作', 'open', '连接医疗机构、医疗服务和合规健康资源，服务真实项目的场景验证与落地。', '涉及医疗和健康业务须提交真实资质及合规材料，平台不承诺未经审核的医疗效果。', '全国|上海', '医疗资源|场景验证|资质审核'],
  ['network-enterprise-chamber', 'network', '企业商会合作', 'open', '招募企业商会及地方商业组织，共建会员服务、项目交流与资源对接。', '欢迎商会提交会员规模、所在区域、重点产业和可联合发起的活动。', '全国', '企业商会|会员服务|产业交流'],
  ['network-association', 'network', '行业协会合作', 'open', '连接行业协会、产业联盟和专业组织，推动行业项目、活动及信息协同。', '合作可从专题活动、行业资源库和项目转介等轻量方式开始。', '全国', '行业协会|产业联盟|专题活动'],
  ['network-community', 'network', '社群合作', 'open', '面向垂直社群、创始人社群和兴趣组织开放互联合作。', '可围绕社群互荐、主题活动、成员权益和项目线索进行合作。', '线上|全国', '社群合作|成员互荐|主题活动'],
  ['network-park', 'network', '园区开放合作', 'open', '寻找产业园区、孵化器和园区招商团队，推进企业入驻、项目落地和产业协同。', '请补充园区城市、主导产业、载体空间及当前开放的合作项目。', '全国|上海', '产业园区|招商合作|项目落地'],
  ['project-concert-investment', 'project', '演唱会及内容项目合作（待项目资料）', 'pending', '围绕演唱会及大型内容项目，征集具备项目资源、投资能力或执行能力的合作线索。', '尚未形成可对外招募的具体项目；后续须提供真实项目资料、合规尽调、投资审批和双方协议，不构成投资承诺。', '全国|上海', '内容项目|待项目资料|合规尽调']
]

export const COOPERATION_CATALOG = RAW_CATALOG.map(([id, category_id, title, status, summary, detail, locations, tags]) => ({
  id, category_id, title, status, status_label: status === 'open' ? '开放合作' : '待定',
  intake_status: status, priority: status === 'open' ? '首批招募' : '持续补充',
  icon: ICONS[category_id], summary, detail, locations: locations.split('|'), tags: tags.split('|')
}))

export function cooperationSnapshot(params = {}) {
  const category = String(params.category || '').trim()
  const status = String(params.status || '').trim()
  const keyword = String(params.keyword || '').trim()
  const list = COOPERATION_CATALOG.filter((entry) => (
    (!category || entry.category_id === category)
    && (!status || entry.status === status)
    && (!keyword || (entry.title + entry.summary + entry.detail + entry.tags.join('') + entry.locations.join('')).includes(keyword))
  )).map((entry) => ({ ...entry, tags: [...entry.tags], locations: [...entry.locations] }))
  const categories = COOPERATION_CATEGORIES.map((item) => ({
    ...item,
    total: COOPERATION_CATALOG.filter((entry) => entry.category_id === item.id).length,
    open: COOPERATION_CATALOG.filter((entry) => entry.category_id === item.id && entry.status === 'open').length
  }))
  return {
    version: '2026-09-07', notice: COOPERATION_NOTICE, categories, list,
    summary: {
      total: list.length, open: list.filter((entry) => entry.status === 'open').length,
      pending: list.filter((entry) => entry.status === 'pending').length, categories: categories.length
    }
  }
}

export default COOPERATION_CATALOG
