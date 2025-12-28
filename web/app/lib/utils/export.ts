export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) {
        return
    }

    // Get headers from first object
    const headers = Object.keys(data[0])

    // Create CSV content
    const csvContent = [
        // Header row
        headers.join(','),
        // Data rows
        ...data.map(row =>
            headers.map(header => {
                const value = row[header]
                // Escape values containing commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`
                }
                return value ?? ''
            }).join(',')
        )
    ].join('\n')

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

export function prepareInventoryDataForExport(products: any[]) {
    return products.map(product => ({
        '제품명': product.name,
        '현재 재고': product.stock_count ?? 0,
        '안전 재고': product.safety_stock ?? 5,
        '재고 상태': product.inventory_status === 'out_of_stock' ? '품절'
            : product.inventory_status === 'low_stock' ? '재고 부족'
                : '정상',
        '가격': product.price ?? 0,
    }))
}

export function prepareCustomerDataForExport(customers: any[]) {
    return customers.map(customer => ({
        '이름': customer.name,
        '전화번호': customer.phone || '-',
        '이메일': customer.email || '-',
        '주소': customer.address || '-',
        '등록일': customer.created_at ? new Date(customer.created_at).toLocaleDateString('ko-KR') : '-',
    }))
}

export function prepareProductDataForExport(products: any[]) {
    return products.map(product => ({
        '제품명': product.name,
        '가격': product.price ?? 0,
        '설명': product.description || '-',
        '상태': product.active ? '활성' : '비활성',
        '재고': product.stock_count ?? '-',
        '등록일': product.created_at ? new Date(product.created_at).toLocaleDateString('ko-KR') : '-',
    }))
}

export function preparePayrollDataForExport(records: any[]) {
    return records.map(record => ({
        '직원명': record.staff_name || '-',
        '기본급': record.base_salary ?? 0,
        '보너스': record.bonus ?? 0,
        '공제액': record.deductions ?? 0,
        '실수령액': record.net_pay ?? 0,
        '지급일': record.payment_date ? new Date(record.payment_date).toLocaleDateString('ko-KR') : '-',
    }))
}
