/**
 * VCF (vCard) 유틸리티
 * 연락처 정보를 vCard 형식으로 변환하고 이메일 전송 기능 제공
 */

import type { Database } from '../types/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

/**
 * 연락처 정보를 VCF (vCard) 형식으로 변환
 * @param contact 연락처 정보
 * @returns VCF 형식 문자열
 */
export function generateVCF(contact: Contact): string {
  const vcfLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
  ]

  // 필수 필드
  if (contact.name) {
    vcfLines.push(`FN:${contact.name}`)
    vcfLines.push(`N:${contact.name};;;;`)
  }

  // 조직 정보
  if (contact.company) {
    vcfLines.push(`ORG:${contact.company}`)
  }
  if (contact.position) {
    vcfLines.push(`TITLE:${contact.position}`)
  }

  // 전화번호들
  if (contact.phone) {
    vcfLines.push(`TEL;TYPE=WORK,VOICE:${contact.phone}`)
  }
  if (contact.mobile) {
    vcfLines.push(`TEL;TYPE=CELL:${contact.mobile}`)
  }
  if (contact.office_phone) {
    vcfLines.push(`TEL;TYPE=WORK:${contact.office_phone}`)
  }
  if (contact.fax) {
    vcfLines.push(`TEL;TYPE=FAX:${contact.fax}`)
  }

  // 이메일
  if (contact.email) {
    vcfLines.push(`EMAIL;TYPE=WORK:${contact.email}`)
  }

  // 주소
  if (contact.address) {
    vcfLines.push(`ADR;TYPE=WORK:;;${contact.address};;;;`)
  }

  // 사용자 정의 필드들
  if (contact.interests) {
    vcfLines.push(`X-INTERESTS:${contact.interests}`)
  }
  if (contact.last_contact) {
    vcfLines.push(`X-LAST-CONTACT:${contact.last_contact}`)
  }

  vcfLines.push('END:VCARD')

  return vcfLines.join('\n')
}

/**
 * VCF 파일을 다운로드
 * @param contact 연락처 정보
 */
export function downloadVCF(contact: Contact): void {
  const vcfContent = generateVCF(contact)
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${contact.name || 'contact'}.vcf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * VCF를 이메일로 전송 (mailto 링크 사용)
 * @param contact 연락처 정보
 * @param recipientEmail 수신자 이메일
 */
export function sendVCFByEmail(contact: Contact, recipientEmail?: string): void {
  const vcfContent = generateVCF(contact)
  const encodedVCF = encodeURIComponent(vcfContent)
  
  const subject = `연락처 정보: ${contact.name || '연락처'}`
  const body = `안녕하세요,\n\n${contact.name || '연락처'}님의 연락처 정보를 공유드립니다.\n\n첨부된 VCF 파일을 저장하시면 주소록에 자동으로 추가됩니다.\n\n--- VCF 내용 ---\n${vcfContent}\n\n감사합니다.`
  
  const mailtoLink = `mailto:${recipientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  
  window.open(mailtoLink, '_blank')
}

/**
 * 공유 가능한 VCF 링크 생성 (Web Share API 사용)
 * @param contact 연락처 정보
 */
export async function shareVCF(contact: Contact): Promise<void> {
  const vcfContent = generateVCF(contact)
  
  if (navigator.share) {
    try {
      // Web Share API를 지원하는 경우
      const blob = new Blob([vcfContent], { type: 'text/vcard' })
      const file = new File([blob], `${contact.name || 'contact'}.vcf`, {
        type: 'text/vcard',
      })
      
      await navigator.share({
        title: `연락처: ${contact.name || '연락처'}`,
        text: `${contact.name || '연락처'}님의 연락처 정보입니다.`,
        files: [file],
      })
    } catch (error) {
      console.error('공유 실패:', error)
      // 폴백: 클립보드에 복사
      fallbackCopyToClipboard(vcfContent, contact.name || '연락처')
    }
  } else {
    // Web Share API를 지원하지 않는 경우 클립보드에 복사
    fallbackCopyToClipboard(vcfContent, contact.name || '연락처')
  }
}

/**
 * 클립보드에 VCF 내용 복사 (폴백)
 * @param vcfContent VCF 내용
 * @param contactName 연락처 이름
 */
function fallbackCopyToClipboard(vcfContent: string, contactName: string): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(vcfContent).then(() => {
      alert(`${contactName}님의 VCF 정보가 클립보드에 복사되었습니다.`)
    }).catch(() => {
      alert('클립보드 복사에 실패했습니다.')
    })
  } else {
    // 구형 브라우저 지원
    const textArea = document.createElement('textarea')
    textArea.value = vcfContent
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      alert(`${contactName}님의 VCF 정보가 클립보드에 복사되었습니다.`)
    } catch (err) {
      alert('클립보드 복사에 실패했습니다.')
    }
    document.body.removeChild(textArea)
  }
}

/**
 * VCF 형식 유효성 검사
 * @param vcfContent VCF 내용
 * @returns 유효한지 여부
 */
export function validateVCF(vcfContent: string): boolean {
  return vcfContent.includes('BEGIN:VCARD') && vcfContent.includes('END:VCARD')
}