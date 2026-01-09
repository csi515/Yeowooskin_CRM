import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@shared/ui'
import type { ButtonProps } from '@shared/ui'
import { Plus } from 'lucide-react'

const meta: Meta<ButtonProps> = {
  title: 'Shared UI/Button',
  component: Button,
  args: {
    children: '버튼',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
  },
}

export default meta
type Story = StoryObj<ButtonProps>

export const Primary: Story = {}

export const WithLeftIcon: Story = {
  args: {
    leftIcon: <Plus size={18} />,
    children: '추가',
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    children: '처리 중',
  },
}

