import React, { useCallback, useMemo, useState } from 'react'
import { useAppSelector } from '../hooks/redux'
import { EXPORT_FORMATS } from '../consts/const'
import { exportSubtitleToFile, exportSegmentsToFile } from '../services/exportService'
import { IoClose, IoDownload } from 'react-icons/io5'
import classNames from 'classnames'
import toast from 'react-hot-toast'

interface ExportPanelProps {
  onClose: () => void
}

const ExportPanel: React.FC<ExportPanelProps> = ({ onClose }) => {
  const data = useAppSelector(state => state.env.data)
  const segments = useAppSelector(state => state.env.segments)
  const title = useAppSelector(state => state.env.title)
  const url = useAppSelector(state => state.env.url)
  const author = useAppSelector(state => state.env.author)
  const ctime = useAppSelector(state => state.env.ctime)
  const transResults = useAppSelector(state => state.env.transResults)

  const [selectedFormat, setSelectedFormat] = useState<ExportConfig['format']>('txt')
  const [includeTime, setIncludeTime] = useState(true)
  const [includeTranslation, setIncludeTranslation] = useState(false)
  const [exportScope, setExportScope] = useState<'all' | 'segment'>('all')
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState<number>(0)

  const hasTranslations = useMemo(() => {
    return Object.values(transResults).some(r => r.code === '200' && r.data)
  }, [transResults])

  const handleExport = useCallback(() => {
    if (!data) {
      toast.error('没有可导出的字幕数据')
      return
    }

    const options = {
      format: selectedFormat,
      includeTime,
      includeTranslation,
      includeNotes: false,
      transResults: includeTranslation ? transResults : undefined,
    }

    try {
      if (exportScope === 'all') {
        exportSubtitleToFile(data, title, url, author, ctime, options)
      } else if (segments && segments[selectedSegmentIdx]) {
        exportSegmentsToFile([segments[selectedSegmentIdx]], title, url, author, ctime, options)
      }
      toast.success('导出成功')
      onClose()
    } catch (e) {
      console.error('Export failed:', e)
      toast.error('导出失败')
    }
  }, [
    data,
    segments,
    selectedFormat,
    includeTime,
    includeTranslation,
    exportScope,
    selectedSegmentIdx,
    title,
    url,
    author,
    ctime,
    transResults,
    onClose,
  ])

  return (
    <div className='fixed inset-0 z-[2000] flex items-center justify-center bg-black/50'>
      <div className='bg-base-100 rounded-lg shadow-2xl w-full max-w-md'>
        <div className='flex items-center justify-between p-4 border-b border-base-300'>
          <h2 className='text-lg font-semibold flex items-center gap-2'>
            <IoDownload className='text-primary' />
            导出字幕
          </h2>
          <button
            className='btn btn-ghost btn-circle btn-sm'
            onClick={onClose}
          >
            <IoClose />
          </button>
        </div>

        <div className='p-4 space-y-4'>
          <div>
            <label className='text-sm font-medium mb-2 block'>导出格式</label>
            <div className='grid grid-cols-3 gap-2'>
              {EXPORT_FORMATS.map(f => (
                <button
                  key={f.code}
                  className={classNames(
                    'btn btn-sm',
                    selectedFormat === f.code ? 'btn-primary' : 'btn-ghost'
                  )}
                  onClick={() => setSelectedFormat(f.code)}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <p className='text-xs text-base-content/60 mt-1'>
              {EXPORT_FORMATS.find(f => f.code === selectedFormat)?.desc}
            </p>
          </div>

          {segments && segments.length > 1 && (
            <div>
              <label className='text-sm font-medium mb-2 block'>导出范围</label>
              <div className='flex gap-2'>
                <button
                  className={classNames(
                    'btn btn-sm flex-1',
                    exportScope === 'all' ? 'btn-primary' : 'btn-ghost'
                  )}
                  onClick={() => setExportScope('all')}
                >
                  全部字幕
                </button>
                <button
                  className={classNames(
                    'btn btn-sm flex-1',
                    exportScope === 'segment' ? 'btn-primary' : 'btn-ghost'
                  )}
                  onClick={() => setExportScope('segment')}
                >
                  当前段落
                </button>
              </div>

              {exportScope === 'segment' && (
                <select
                  className='select select-sm select-bordered w-full mt-2'
                  value={selectedSegmentIdx}
                  onChange={e => setSelectedSegmentIdx(parseInt(e.target.value))}
                >
                  {segments.map((seg, idx) => (
                    <option key={seg.startIdx} value={idx}>
                      {seg.chapterTitle || `段落 ${idx + 1}`} ({seg.items.length} 条)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className='space-y-2'>
            <label className='text-sm font-medium mb-2 block'>导出选项</label>

            {['txt', 'csv'].includes(selectedFormat) && (
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  className='checkbox checkbox-sm'
                  checked={includeTime}
                  onChange={e => setIncludeTime(e.target.checked)}
                />
                <span className='text-sm'>包含时间戳</span>
              </label>
            )}

            {hasTranslations && (
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  className='checkbox checkbox-sm'
                  checked={includeTranslation}
                  onChange={e => setIncludeTranslation(e.target.checked)}
                />
                <span className='text-sm'>包含翻译内容</span>
              </label>
            )}
          </div>

          <div className='text-xs text-base-content/60 bg-base-200 rounded p-3'>
            <p>导出预览:</p>
            <p className='mt-1'>
              文件名: {title || 'subtitle'}.{selectedFormat}
            </p>
            <p>
              字幕数量:{' '}
              {exportScope === 'all'
                ? data?.body.length || 0
                : segments?.[selectedSegmentIdx]?.items.length || 0}{' '}
              条
            </p>
          </div>
        </div>

        <div className='flex justify-end gap-2 p-4 border-t border-base-300'>
          <button className='btn btn-ghost' onClick={onClose}>
            取消
          </button>
          <button className='btn btn-primary' onClick={handleExport}>
            导出
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportPanel
