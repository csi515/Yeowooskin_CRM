
export const MOCK_PRODUCTS = [
    { id: 'prod_1', name: '베이직 스킨케어 1회', price: 50000, active: true },
    { id: 'prod_2', name: '프리미엄 미백 관리', price: 80000, active: true },
    { id: 'prod_3', name: '전신 아로마 테라피', price: 120000, active: true },
    { id: 'prod_4', name: '여드름 케어 패키지', price: 60000, active: true },
    { id: 'prod_5', name: '수분 폭탄 마스크', price: 30000, active: true },
    { id: 'prod_6', name: '골드 테라피', price: 150000, active: true },
    { id: 'prod_7', name: '비타민 C 앰플 관리', price: 70000, active: true },
    { id: 'prod_8', name: '등 경락 마사지', price: 90000, active: true },
    { id: 'prod_9', name: '하체 부종 관리', price: 80000, active: true },
    { id: 'prod_10', name: '윤곽 관리', price: 110000, active: true },
    { id: 'prod_11', name: '목/어깨 집중 관리', price: 40000, active: true },
    { id: 'prod_12', name: '발 관리 (30분)', price: 30000, active: true },
    { id: 'prod_13', name: '두피 스케일링', price: 50000, active: true },
    { id: 'prod_14', name: '웨딩 케어 A코스', price: 200000, active: true },
    { id: 'prod_15', name: '웨딩 케어 B코스', price: 300000, active: true },
    { id: 'prod_16', name: '맨즈 스킨케어', price: 60000, active: true },
    { id: 'prod_17', name: '여드름 흉터 재생', price: 100000, active: true },
    { id: 'prod_18', name: '물광 주사 관리', price: 130000, active: true },
    { id: 'prod_19', name: '카복시 팩', price: 25000, active: true },
    { id: 'prod_20', name: '모델링 팩 추가', price: 10000, active: true },
]

export const MOCK_CUSTOMERS = Array.from({ length: 25 }).map((_, i) => ({
    id: `cust_${i + 1}`,
    name: ['김철수', '이영희', '박지민', '최수영', '정민호', '강다니엘', '송혜교', '전지현', '공유', '이동욱', '손예진', '현빈', '박서준', '김지원', '남주혁', '배수지', '아이유', '조정석', '유연석', '김고은', '이민호', '박보영', '서강준', '차은우', '한소희'][i],
    phone: `010-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    email: `customer${i + 1}@example.com`,
    created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    visit_count: Math.floor(Math.random() * 20),
    features: i % 3 === 0 ? '민감성 피부' : i % 3 === 1 ? '건성' : '지성',
    address: i % 2 === 0 ? '서울시 강남구' : '서울시 서초구',
}))

const now = new Date()
export const MOCK_APPOINTMENTS = Array.from({ length: 40 }).map((_, i) => {
    const date = new Date(now.getTime() + (Math.random() - 0.5) * 14 * 24 * 60 * 60 * 1000) // +/- 7 days
    const cust = MOCK_CUSTOMERS[i % MOCK_CUSTOMERS.length]!
    const prod = MOCK_PRODUCTS[i % MOCK_PRODUCTS.length]!
    return {
        id: `apt_${i + 1}`,
        customer_id: cust.id,
        service_id: prod.id,
        owner_id: 'demo-user',
        appointment_date: date.toISOString(),
        status: date < now ? 'completed' : 'scheduled',
        total_price: prod.price,
        notes: i % 5 === 0 ? '첫 방문' : '',
        created_at: new Date(date.getTime() - 86400000 * 3).toISOString()
    }
}).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())

// Held Products (Customer Products)
export const MOCK_CUSTOMER_PRODUCTS = Array.from({ length: 25 }).map((_, i) => {
    const cust = MOCK_CUSTOMERS[i % MOCK_CUSTOMERS.length]!
    const prod = MOCK_PRODUCTS[(i + 2) % MOCK_PRODUCTS.length]!
    return {
        id: `cp_${i + 1}`,
        customer_id: cust.id,
        product_id: prod.id,
        owner_id: 'demo-user',
        quantity: Math.floor(Math.random() * 10) + 1,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString(),
        products: { name: prod.name } // Join result simulation
    }
})

// Points Ledger
export const MOCK_POINTS_LEDGER = MOCK_CUSTOMERS.flatMap(c => {
    // Each customer has 1-3 ledger entries
    const count = Math.floor(Math.random() * 3) + 1
    const entries = []
    let balance = 0
    for (let j = 0; j < count; j++) {
        const delta = (Math.floor(Math.random() * 10) + 1) * 1000 * (Math.random() > 0.3 ? 1 : -1)
        balance += delta
        entries.push({
            id: `pl_${c.id}_${j}`,
            customer_id: c.id,
            owner_id: 'demo-user',
            delta,
            reason: delta > 0 ? '상품 구매 적립' : '포인트 사용',
            created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
        })
    }
    return entries
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

// Derived Dashboard Data
export const MOCK_DASHBOARD_DATA = {
    todayAppointments: MOCK_APPOINTMENTS.filter(a => {
        const d = new Date(a.appointment_date)
        const n = new Date()
        return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
    }).length,
    monthlyProfit: 3500000, // Hardcoded for simplicity or calculate
    monthlyNewCustomers: MOCK_CUSTOMERS.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 3600 * 1000)).length,
    activeProducts: MOCK_PRODUCTS,
    recentAppointments: MOCK_APPOINTMENTS.slice(0, 5).map(a => ({
        id: a.id,
        appointment_date: a.appointment_date,
        customer_name: MOCK_CUSTOMERS.find(c => c.id === a.customer_id)?.name || 'Unknown',
        product_name: MOCK_PRODUCTS.find(p => p.id === a.service_id)?.name || 'Unknown',
    })),
    recentTransactions: [
        { id: 'tx_1', type: 'income', date: new Date().toISOString(), amount: 50000, memo: '김철수 - 베이직 케어' },
        { id: 'tx_2', type: 'income', date: new Date(Date.now() - 3600000).toISOString(), amount: 80000, memo: '이영희 - 프리미엄 미백' },
        { id: 'tx_3', type: 'expense', date: new Date(Date.now() - 7200000).toISOString(), amount: 15000, memo: '소모품 구매' },
        { id: 'tx_4', type: 'income', date: new Date(Date.now() - 86400000).toISOString(), amount: 120000, memo: '박지민 - 아로마' },
        { id: 'tx_5', type: 'expense', date: new Date(Date.now() - 90000000).toISOString(), amount: 500000, memo: '월세' },
    ]
}

export const MOCK_EXPENSES = Array.from({ length: 15 }).map((_, i) => ({
    id: `exp_${i + 1}`,
    owner_id: 'demo-user',
    expense_date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
    amount: (Math.floor(Math.random() * 50) + 1) * 1000,
    category: ['소모품', '월세', '간식비', '공과금', '기타'][i % 5],
    memo: `지출 내역 ${i + 1}`,
    created_at: new Date().toISOString()
}))

export const MOCK_TRANSACTIONS = Array.from({ length: 20 }).map((_, i) => ({
    id: `tx_${i + 1}`,
    owner_id: 'demo-user',
    transaction_date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
    amount: (Math.floor(Math.random() * 100) + 10) * 1000,
    type: i % 3 === 0 ? 'expense' : 'income',
    category: i % 3 === 0 ? '소모품' : '시술비',
    memo: `거래 내역 ${i + 1}`,
    created_at: new Date().toISOString()
}))
