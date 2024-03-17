import classNames from 'classnames'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

function CopyBtn(props: {
  content: string
}) {
  const {content} = props
  return <div className='flex justify-center mt-1'>
    <button className="btn btn-xs px-10 btn-primary normal-case" onClick={() => {
      navigator.clipboard.writeText(content).then(() => {
        toast.success('Copied!')
      }).catch(console.error)
    }}>Copy
    </button>
  </div>
}

function Markdown(props: {
  content: string
  codeBlockClass?: string
}) {
  const {content, codeBlockClass} = props

  return <ReactMarkdown
    className='markdown prose prose-sm dark:prose-invert prose-h1:text-center prose-h1:font-bold prose-h1:underline-offset-4 overflow-y-auto scrollbar-hide'
    linkTarget={'_blank'}
    components={{
      code({node, inline, className, children, ...props}) {
        if (inline) {
          return <code
            className={classNames(className, 'md-inline-block kbd kbd-xs rounded text-base-content/80')} {...props}>
            {children}
          </code>
        } else {
          return <code className={classNames(className, 'relative', codeBlockClass)} {...props}>
            {children}
            {className?.includes('language-copy') && <CopyBtn content={children[0] as string}/>}
          </code>
        }
      }
    }}
  >{content}</ReactMarkdown>
}

export default Markdown
