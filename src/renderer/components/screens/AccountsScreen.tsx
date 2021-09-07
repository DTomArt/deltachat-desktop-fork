import React, { useState, useEffect, useContext } from 'react'
import { ipcBackend } from '../../ipc'
import { Classes, Elevation, Intent, Card, Icon } from '@blueprintjs/core'
import { DeltaProgressBar } from '../Login-Styles'
import { getLogger } from '../../../shared/logger'
import { ScreenContext, useTranslationFunction } from '../../contexts'
import DeltaDialog, {
  DeltaDialogFooter,
  DeltaDialogFooterActions,
  DeltaDialogBase,
  DeltaDialogBody,
  DeltaDialogContent,
  DeltaDialogHeader,
} from '../dialogs/DeltaDialog'
import { DeltaChatAccount } from '../../../shared/shared-types'
import filesizeConverter from 'filesize'
import { DialogProps } from '../dialogs/DialogController'
import { DeltaBackend } from '../../delta-remote'
import { IpcRendererEvent } from 'electron'
import { Avatar } from '../Avatar'
import { PseudoContact } from '../contact/Contact'
import { runtime } from '../../runtime'
import type ScreenController from '../../ScreenController'

const log = getLogger('renderer/components/AccountsScreen')

function ImportBackupProgressDialog({
  onClose,
  isOpen,
  backupFile,
}: DialogProps) {
  const [importProgress, setImportProgress] = useState(0.0)
  const [error, setError] = useState(null)

  const onAll = (eventName: IpcRendererEvent, data1: string, data2: string) => {
    log.debug('ALL core events: ', eventName, data1, data2)
  }
  const onImexProgress = (_evt: any, [progress, _data2]: [number, any]) => {
    setImportProgress(progress)
  }

  const onError = (_data1: any, data2: string) => {
    setError('DC_EVENT_ERROR: ' + data2)
  }

  useEffect(() => {
    ;(async () => {
      let account
      try {
        account = await DeltaBackend.call('backup.import', backupFile)
      } catch (err) {
        setError(err)
        return
      }
      onClose()
      window.__selectAccount(account.id)
    })()

    ipcBackend.on('ALL', onAll)
    ipcBackend.on('DC_EVENT_IMEX_PROGRESS', onImexProgress)
    ipcBackend.on('DC_EVENT_ERROR', onError)

    return () => {
      ipcBackend.removeListener('ALL', onAll)
      ipcBackend.removeListener('DC_EVENT_IMEX_PROGRESS', onImexProgress)
      ipcBackend.removeListener('DC_EVENT_ERROR', onError)
    }
  }, [backupFile, onClose])

  const tx = useTranslationFunction()
  return (
    <DeltaDialog
      onClose={onClose}
      title={tx('import_backup_title')}
      // canOutsideClickClose
      isOpen={isOpen}
      style={{ top: '40%' }}
    >
      <div className={Classes.DIALOG_BODY}>
        <Card elevation={Elevation.ONE}>
          {error && (
            <p>
              {tx('error')}: {error}
            </p>
          )}
          <DeltaProgressBar
            progress={importProgress}
            intent={error === false ? Intent.SUCCESS : Intent.DANGER}
          />
        </Card>
      </div>
    </DeltaDialog>
  )
}

const ImportButton = function ImportButton(_props: any) {
  const tx = useTranslationFunction()

  async function onClickImportBackup() {
    const file = await runtime.showOpenFileDialog({
      title: tx('import_backup_title'),
      properties: ['openFile'],
      filters: [{ name: '.tar or .bak', extensions: ['tar', 'bak'] }],
      defaultPath: runtime.getAppPath('downloads'),
    })
    if (file) {
      window.__openDialog(ImportBackupProgressDialog, {
        backupFile: file,
      })
    }
  }

  return (
    <p
      className={'delta-button light-bold primary'}
      onClick={onClickImportBackup}
    >
      {tx('import_backup_title')}
    </p>
  )
}

const ScanQRCodeButton = React.memo(function ScanQRCode(_) {
  const { openDialog } = useContext(ScreenContext)
  const tx = useTranslationFunction()

  const onClickScanQr = () => openDialog('ImportQrCode')

  return (
    <p className={'delta-button light-bold primary'} onClick={onClickScanQr}>
      {tx('qrscan_title')}
    </p>
  )
})

export default function AccountsScreen({
  selectAccount,
}: {
  selectAccount: typeof ScreenController.prototype.selectAccount
}) {
  const tx = useTranslationFunction()
  const [logins, setLogins] = useState(null)

  const refreshAccounts = async () => {
    const logins = await DeltaBackend.call('login.getAllAccounts')
    setLogins(logins)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const logins = await DeltaBackend.call('login.getAllAccounts')
      if (mounted === true) {
        setLogins(logins)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const addAccount = async () => {
    const accountId = await DeltaBackend.call('login.addAccount')
    selectAccount(accountId)
  }

  if (logins === null) return null

  return (
    <div className='login-screen'>
      <div className='window'>
        <DeltaDialogBase
          isOpen={true}
          backdropProps={{ className: 'no-backdrop' }}
          onClose={() => {}}
          fixed={true}
        >
          <>
            {(!logins || logins.length === 0) && (
              <DeltaDialogBody>
                <DeltaDialogContent>
                  <div className='welcome-deltachat'>
                    <img className='delta-icon' src='../images/deltachat.png' />
                    <p className='f1'>{tx('welcome_desktop')}</p>
                    <p className='f2'>{tx('welcome_intro1_message')}</p>
                    <div
                      id='action-go-to-login'
                      className='welcome-button'
                      onClick={addAccount}
                    >
                      {tx('login_header')}
                    </div>
                  </div>
                </DeltaDialogContent>
              </DeltaDialogBody>
            )}
            {logins && logins.length > 0 && (
              <>
                <DeltaDialogHeader
                  title={tx('login_known_accounts_title_desktop')}
                />
                <DeltaDialogBody>
                  <DeltaDialogContent noPadding={true}>
                    <AccountSelection
                      {...{
                        refreshAccounts,
                        addAccount,
                        selectAccount,
                        logins,
                      }}
                    />
                  </DeltaDialogContent>
                </DeltaDialogBody>
              </>
            )}
            <DeltaDialogFooter style={{ padding: '10px' }}>
              <DeltaDialogFooterActions
                style={{ justifyContent: 'space-between' }}
              >
                <ScanQRCodeButton />
                <ImportButton />
              </DeltaDialogFooterActions>
            </DeltaDialogFooter>
          </>
        </DeltaDialogBase>
      </div>
    </div>
  )
}

function AccountSelection({
  refreshAccounts,
  addAccount,
  selectAccount,
  logins,
}: {
  refreshAccounts: () => Promise<void>
  addAccount: () => {}
  selectAccount: typeof ScreenController.prototype.selectAccount
  logins: any
}) {
  const tx = useTranslationFunction()
  const { openDialog } = useContext(ScreenContext)

  const removeAccount = (account: DeltaChatAccount) => {
    const header = tx(
      'ask_delete_value',
      account.type == 'configured' ? account.addr : '[unconfigured]'
    )
    const message = tx(
      'delete_account_explain_with_name',
      account.type == 'configured' ? account.addr : '[unconfigured]'
    )
    openDialog('ConfirmationDialog', {
      header,
      message,
      confirmLabel: tx('delete_account'),
      isConfirmDanger: true,
      cb: async (yes: boolean) => {
        if (yes) {
          await DeltaBackend.call('login.removeAccount', account.id)
          refreshAccounts()
        }
      },
    })
  }

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const parent = document.querySelector<HTMLDivElement>('#accounts')
      const current = parent?.querySelector(':focus')

      if (ev.key == 'ArrowDown') {
        if (current && current.nextElementSibling) {
          ;(current.nextElementSibling as HTMLDivElement)?.focus()
        } else {
          ;(parent?.firstElementChild as HTMLDivElement).focus()
        }
      } else if (ev.key == 'ArrowUp') {
        if (current && current.previousElementSibling) {
          ;(current.previousElementSibling as HTMLDivElement)?.focus()
        } else {
          ;(parent?.lastElementChild as HTMLDivElement).focus()
        }
      } else if (ev.key == 'Enter') {
        if (current) {
          ;(current as HTMLDivElement)?.click()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className='accounts' id='accounts' role='menu'>
      <div
        role='menu-item'
        id='action-go-to-login'
        className='contact-list-item'
        onClick={addAccount}
        tabIndex={0}
      >
        <PseudoContact cutoff='+' text={tx('add_account')}></PseudoContact>
      </div>
      {logins.map((login: DeltaChatAccount, index: Number) => (
        <AccountItem
          key={`login-${index}`}
          login={login}
          selectAccount={selectAccount}
          removeAccount={removeAccount}
        />
      ))}
    </div>
  )
}

function AccountItem({
  login,
  selectAccount,
  removeAccount,
}: {
  login: DeltaChatAccount
  selectAccount: typeof ScreenController.prototype.selectAccount
  removeAccount: (account: DeltaChatAccount) => void
}) {
  const removeAction = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    ev?.stopPropagation()
    removeAccount(login)
  }

  const [account_size, setSize] = useState<string>('?')

  useEffect(() => {
    DeltaBackend.call('login.getAccountSize', login.id)
      .catch(log.error)
      .then(bytes => {
        bytes && setSize(filesizeConverter(bytes))
      })
  }, [login.id])

  const tx = window.static_translate

  let inner
  if (login.type === 'configured') {
    const title = tx('account_info_hover_tooltip_desktop', [
      login.addr,
      account_size,
      String(login.id),
    ])
    inner = (
      <div className='contact'>
        <Avatar
          {...{
            avatarPath: login.profile_image,
            color: login.color,
            displayName: login.display_name,
            addr: login.addr,
          }}
        />
        <div className='contact-name'>
          <div className='display-name'>{login.display_name || login.addr}</div>
          <div
            className='email'
            style={{ display: 'inline-block' }}
            title={title}
          >
            {login.addr}
          </div>
        </div>
      </div>
    )
  } else {
    inner = (
      <div className='contact'>
        <Avatar displayName={null} addr={'?'} />
        <div className='contact-name'>
          <div className='display-name'>{tx('unconfigured_account')}</div>
          <div className='email' style={{ display: 'inline-block' }}>
            {tx('unconfigured_account_subtitle')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      role='menu-item'
      className='contact-list-item'
      onClick={() => selectAccount(login.id)}
      tabIndex={0}
    >
      {inner}
      <div
        role='button'
        aria-label={window.static_translate('delete_account')}
        className='remove-icon'
        onClick={removeAction}
      >
        <Icon icon='cross' />
      </div>
    </div>
  )
}