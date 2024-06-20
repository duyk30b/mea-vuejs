import { Alignment } from '@ckeditor/ckeditor5-alignment'
import {
  Bold,
  Code,
  Italic,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from '@ckeditor/ckeditor5-basic-styles'
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote'
import { CodeBlock } from '@ckeditor/ckeditor5-code-block'
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic'
import { Essentials } from '@ckeditor/ckeditor5-essentials'
import Font from '@ckeditor/ckeditor5-font/src/font'
import { Heading } from '@ckeditor/ckeditor5-heading'
import { HorizontalLine } from '@ckeditor/ckeditor5-horizontal-line'
import { Indent, IndentBlock } from '@ckeditor/ckeditor5-indent'
import { Link } from '@ckeditor/ckeditor5-link'
import { List, TodoList } from '@ckeditor/ckeditor5-list'
import { Paragraph } from '@ckeditor/ckeditor5-paragraph'
import { RemoveFormat } from '@ckeditor/ckeditor5-remove-format'
import { SourceEditing } from '@ckeditor/ckeditor5-source-editing'
import {
  Table,
  TableCellPropertiesEditing,
  TableCellPropertiesUI,
  TablePropertiesEditing,
  TablePropertiesUI,
  TableToolbar,
} from '@ckeditor/ckeditor5-table'
import { Undo } from '@ckeditor/ckeditor5-undo'

class BasicEditor extends ClassicEditor {}
BasicEditor.builtinPlugins = [
  Essentials, // IMPORTANT: plugin quan trọng bắt buộc có
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Code,
  Subscript,
  Superscript,
  RemoveFormat,
  Font,
  Undo,
  Alignment,
  List,
  Indent,
  IndentBlock,
  TodoList,
  SourceEditing,
  // Autoformat,
  HorizontalLine,
  BlockQuote,
  Heading,
  Link,
  Table,
  TableToolbar,
  TablePropertiesUI,
  TablePropertiesEditing,
  TableCellPropertiesEditing,
  TableCellPropertiesUI,
  CodeBlock,
  Paragraph, // IMPORTANT: plugin quan trọng bắt buộc có
]

BasicEditor.defaultConfig = {
  toolbar: {
    items: [
      'undo',
      'redo',
      'removeFormat',
      '|',
      {
        label: 'Font',
        items: [
          'fontSize',
          'fontColor',
          'fontBackgroundColor',
          '|',
          'bold',
          'italic',
          'strikethrough',
          'underline',
          'code',
          'subscript',
          'superscript',
        ],
        icon: `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.187 17H5.773c-.637 0-1.092-.138-1.364-.415-.273-.277-.409-.718-.409-1.323V4.738c0-.617.14-1.062.419-1.332.279-.27.73-.406 1.354-.406h4.68c.69 0 1.288.041 1.793.124.506.083.96.242 1.36.478.341.197.644.447.906.75a3.262 3.262 0 0 1 .808 2.162c0 1.401-.722 2.426-2.167 3.075C15.05 10.175 16 11.315 16 13.01a3.756 3.756 0 0 1-2.296 3.504 6.1 6.1 0 0 1-1.517.377c-.571.073-1.238.11-2 .11zm-.217-6.217H7v4.087h3.069c1.977 0 2.965-.69 2.965-2.072 0-.707-.256-1.22-.768-1.537-.512-.319-1.277-.478-2.296-.478zM7 5.13v3.619h2.606c.729 0 1.292-.067 1.69-.2a1.6 1.6 0 0 0 .91-.765c.165-.267.247-.566.247-.897 0-.707-.26-1.176-.778-1.409-.519-.232-1.31-.348-2.375-.348H7z"/></svg>`,
      },
      {
        label: 'Paragraph formatting',
        items: [
          'alignment',
          'indent',
          'outdent',
          // '|',
          // 'bulletedList',
          // 'numberedList',
          // 'todoList',

          '|',
          'blockQuote',
          'link',
          'horizontalLine',
          'codeBlock',
        ],
        icon: `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2 3.75c0 .414.336.75.75.75h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm0 8c0 .414.336.75.75.75h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm0 4c0 .414.336.75.75.75h9.929a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm0-8c0 .414.336.75.75.75h9.929a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75z"/></svg>`,
      },
      '|',
      'insertTable',
      // 'sourceEditing',
    ],
    shouldNotGroupWhenFull: true, // chưa fix được lỗi này
  },
  fontSize: {
    options: [10, 12, 'default', 16, 18, 20],
    supportAllValues: true,
  },
  table: {
    contentToolbar: [
      'tableColumn',
      'tableRow',
      'mergeTableCells',
      'tableProperties',
      'tableCellProperties',
    ],
  },
} as any

export { BasicEditor }
