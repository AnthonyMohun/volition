'use client'

import { useState, useRef } from 'react'
import { StickyNote as StickyNoteType } from '@/lib/types'
import { Trash2, Image as ImageIcon, Star, X, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StickyNoteProps {
  note: StickyNoteType
  onUpdate: (updates: Partial<StickyNoteType>) => void
  onDelete: () => void
  isDragging?: boolean
}

export function StickyNote({ note, onUpdate, onDelete, isDragging }: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(note.text)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTextSave = () => {
    if (editText.trim()) {
      onUpdate({ text: editText.trim() })
      setIsEditing(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    try {
      const { compressImage } = await import('@/lib/utils')
      const dataUrl = await compressImage(file)
      
      onUpdate({
        image: {
          dataUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        },
      })
    } catch (error) {
      console.error('Failed to process image:', error)
      alert('Failed to process image')
    }
  }

  const handleRemoveImage = () => {
    onUpdate({ image: undefined })
  }

  const toggleConcept = () => {
    onUpdate({ isConcept: !note.isConcept })
  }

  return (
    <>
      <div
        className={cn(
          'w-64 p-4 rounded-lg shadow-lg cursor-move transition-transform hover:shadow-xl',
          isDragging && 'opacity-50 scale-95',
          note.isConcept && 'ring-2 ring-yellow-400 ring-offset-2'
        )}
        style={{
          backgroundColor: note.color,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2" onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={toggleConcept}
            className={cn(
              'p-1 rounded hover:bg-black/10 transition-colors',
              note.isConcept && 'text-yellow-600'
            )}
            title={note.isConcept ? 'Remove from concepts' : 'Mark as concept'}
          >
            <Star className={cn('w-4 h-4', note.isConcept && 'fill-current')} />
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded hover:bg-black/10 transition-colors"
              title="Attach image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded hover:bg-black/10 transition-colors"
              title="Edit note"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image */}
        {note.image && (
          <div className="mb-2 relative group">
            <img
              src={note.image.dataUrl}
              alt={note.image.caption || 'Note attachment'}
              className="w-full h-32 object-cover rounded cursor-pointer"
              onClick={() => setShowImagePreview(true)}
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
            {note.image.caption && (
              <p className="text-xs text-gray-600 mt-1 italic">{note.image.caption}</p>
            )}
          </div>
        )}

        {/* Text Content */}
        {isEditing ? (
          <div className="space-y-2" onPointerDown={(e) => e.stopPropagation()}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm resize-none bg-white text-gray-900"
              rows={3}
              autoFocus
              onBlur={handleTextSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleTextSave()
                }
              }}
            />
          </div>
        ) : (
          <p 
            className="text-sm text-gray-900 whitespace-pre-wrap break-words cursor-text"
            onClick={() => setIsEditing(true)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {note.text}
          </p>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && note.image && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={note.image.dataUrl}
              alt={note.image.caption || 'Note attachment'}
              className="max-w-full max-h-[90vh] object-contain"
            />
            {note.image.caption && (
              <p className="text-white text-center mt-4">{note.image.caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
