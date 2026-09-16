import {
  Calculator,
  HomeIcon,
  ArrowLeftRight,
  Braces,
  KeyRound,
  Scale,
  CalendarDays,
  HandCoins,
  Umbrella,
  type LucideIcon,
} from 'lucide-react'

export interface Tool {
  id: string
  name: string
  path: string
  description: string
  category: string
  icon: LucideIcon
  keywords: string[]
  popular?: boolean
}

export const tools: Tool[] = [
  {
    id: 'tax',
    name: '个人所得税计算器',
    path: '/tools/tax',
    description: '输入税前月薪、五险一金，快速估算每月个税和到手工资。',
    category: '财务计算',
    icon: Calculator,
    keywords: ['个税', '工资', '税后', '五险一金', '薪资', '税率'],
    popular: true,
  },
  {
    id: 'mortgage',
    name: '房贷计算器',
    path: '/tools/mortgage',
    description: '等额本息 / 等额本金两种方式对比，查看月供明细和还款曲线。',
    category: '财务计算',
    icon: HomeIcon,
    keywords: ['房贷', '月供', '贷款', '按揭', '公积金', '还款'],
    popular: true,
  },
  {
    id: 'prepayment',
    name: '提前还贷计算器',
    path: '/tools/prepayment',
    description: '对比减少月供与缩短年限两种方案，算清提前还款能省多少利息。',
    category: '财务计算',
    icon: HandCoins,
    keywords: ['提前还贷', '提前还款', '房贷', '缩短年限', '减少月供', '省利息'],
    popular: true,
  },
  {
    id: 'social-insurance',
    name: '五险一金计算器',
    path: '/tools/social-insurance',
    description: '输入税前月薪和缴费基数，估算五险一金明细、个税和到手工资。',
    category: '财务计算',
    icon: Umbrella,
    keywords: ['五险一金', '社保', '公积金', '税后工资', '到手', '缴纳比例'],
    popular: true,
  },
  {
    id: 'converter',
    name: '单位换算器',
    path: '/tools/converter',
    description: '长度、重量、温度、存储容量常用单位即时换算。',
    category: '日常实用',
    icon: ArrowLeftRight,
    keywords: ['换算', '单位', '厘米', '英寸', '磅', '公斤', '温度'],
  },
  {
    id: 'json',
    name: 'JSON 格式化工具',
    path: '/tools/json',
    description: 'JSON 在线格式化、压缩、校验，报错时精确定位出错行。',
    category: '开发工具',
    icon: Braces,
    keywords: ['json', '格式化', '校验', '压缩', '开发'],
  },
  {
    id: 'password',
    name: '密码生成器',
    path: '/tools/password',
    description: '本地生成高强度随机密码，支持自定义长度和字符集。',
    category: '开发工具',
    icon: KeyRound,
    keywords: ['密码', '随机', '安全', '生成'],
  },
  {
    id: 'bmi',
    name: 'BMI 计算器',
    path: '/tools/bmi',
    description: '输入身高体重，按中国成人标准评估 BMI 指数和标准体重范围。',
    category: '健康计算',
    icon: Scale,
    keywords: ['bmi', '体重', '身高', '肥胖', '标准体重', '健康', '体脂'],
    popular: true,
  },
  {
    id: 'dates',
    name: '日期天数计算器',
    path: '/tools/dates',
    description: '计算两个日期相差多少天、几个工作日，或推算 N 天前后是几号星期几。',
    category: '日常实用',
    icon: CalendarDays,
    keywords: ['日期', '天数', '倒计时', '相差', '工作日', '推算', '日历'],
    popular: true,
  },
]

export const categories = ['全部', ...Array.from(new Set(tools.map((t) => t.category)))]
