import {PropsWithChildren, useState} from 'react'
import {Modifier, usePopper} from 'react-popper'
import popoverStyles from './Popover.module.less'
import * as PopperJS from '@popperjs/core'
import classNames from 'classnames'

interface Props extends PropsWithChildren {
  /**
   * 用于定位弹出框的元素
   */
  refElement: Element | PopperJS.VirtualElement | null
  className?: string | undefined
  arrowClassName?: string | undefined
  options?: Omit<Partial<PopperJS.Options>, 'modifiers'> & {
    createPopper?: typeof PopperJS.createPopper
    modifiers?: ReadonlyArray<Modifier<any>>
  }
}

const Popover = (props: Props) => {
  const {children, className, arrowClassName, refElement, options} = props

  const [popperElement, setPopperElement] = useState<any>(null)
  const [arrowElement, setArrowElement] = useState<any>(null)
  const { styles, attributes } = usePopper<any>(refElement, popperElement, {
    placement: 'top',
    modifiers: [
      {name: 'arrow', options: {element: arrowElement}},
      {name: 'offset', options: {offset: [0, 8]}},
    ],
    ...options??{},
  })

  return <div className={classNames(popoverStyles.tooltip, className)} ref={setPopperElement} style={styles.popper} {...attributes.popper}>
    <div className={classNames(popoverStyles.arrow, arrowClassName)} data-popper-arrow ref={setArrowElement} style={styles.arrow} />
    {children}
  </div>
}

export default Popover
