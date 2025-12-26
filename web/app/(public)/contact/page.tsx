import { Metadata } from 'next'
import ContactContent from './ContactContent'

export const metadata: Metadata = {
    title: '문의하기 - Contact | BeautyHub',
    description: 'BeautyHub 사용에 대한 문의사항을 남겨주세요. 빠른 시일 내에 답변드리겠습니다.',
    keywords: '문의, 고객센터, Contact, 문의하기',
}

export default function ContactPage() {
    return <ContactContent />
}
