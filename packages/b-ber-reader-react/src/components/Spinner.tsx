import classNames from 'classnames'
import React from 'react'
import { useStore } from '../store/StoreContext'
import styles from './Spinner.module.css'

function Spinner() {
  const spinnerVisible = useStore((s) => s.userInterface.spinnerVisible)

  return (
    <div
      className={classNames(styles.spinner, {
        [styles.visible]: spinnerVisible,
      })}
    >
      <div className={styles.detail} />
    </div>
  )
}

export default Spinner
