import {useCallback, useState} from 'react'

const useEventChecked = (initValue?: boolean) => {
  const [value, setValue] = useState(initValue)

  const onChange = useCallback((e: any) => {
    setValue(e.target.checked)
  }, [])

  return {value, setValue, onChange}
}

export default useEventChecked
