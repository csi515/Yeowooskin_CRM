import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '@shared/ui'
import type { InputProps } from '@shared/ui'
import { Search } from 'lucide-react'

const meta: Meta<InputProps> = {
  title: 'Shared UI/Input',
  component: Input,
  args: {
    label: '이름',
    placeholder: '이름을 입력하세요',
    fullWidth: true,
  },
}

export default meta
type Story = StoryObj<InputProps>

export const Default: Story = {}

export const WithLeftIcon: Story = {
  args: {
    label: '검색',
    placeholder: '검색어를 입력하세요',
    leftIcon: <Search size={18} />,
  },
}

export const Error: Story = {
  args: {
    label: '이름',
    placeholder: '이름을 입력하세요',
    error: '필수 입력 항목입니다',
  },
}

