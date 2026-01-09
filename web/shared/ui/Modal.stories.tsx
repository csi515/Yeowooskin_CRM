import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from '@shared/ui'
import type { ModalProps } from '@shared/ui'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

type StoryArgs = Omit<ModalProps, 'open' | 'onClose' | 'children'> & {
  title: string
}

const meta: Meta<StoryArgs> = {
  title: 'Shared UI/Modal',
  component: Modal,
  args: {
    size: 'lg',
    closeOnOutsideClick: true,
    disableAutoFocus: false,
    fullScreenOnMobile: true,
    title: '제목',
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>모달 열기</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          size={args.size ?? 'lg'}
          closeOnOutsideClick={args.closeOnOutsideClick ?? true}
          disableAutoFocus={args.disableAutoFocus ?? false}
          fullScreenOnMobile={args.fullScreenOnMobile ?? true}
        >
          <ModalHeader title={args.title} description="설명 텍스트" onClose={() => setOpen(false)} />
          <ModalBody>
            <Stack spacing={2}>
              <Typography variant="body1">
                공용 UI 모달 컴포넌트의 기본 구조(헤더/바디/푸터)를 표준화합니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                모바일에서는 기본적으로 전체 화면(fullScreenOnMobile) 동작을 합니다.
              </Typography>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              닫기
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              확인
            </Button>
          </ModalFooter>
        </Modal>
      </>
    )
  },
}

