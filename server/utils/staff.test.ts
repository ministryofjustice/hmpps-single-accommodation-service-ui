import { assignedUserFactory } from '../testutils/factories'
import { staffName } from './staff'

describe('staffName', () => {
  it('returns "You (name)" when the assignedTo username matches the given username', () => {
    const staff = assignedUserFactory.build({
      username: 'alice_smith',
      forename: 'Alice',
      surname: 'Smith',
    })

    expect(staffName(staff, 'alice_smith')).toEqual('You (Alice Smith)')
  })

  it.each(['USERNAMEONE', 'usernameone', 'UsernameOne'])(
    'matches for username %s using case-insensitive comparison',
    username => {
      const staff = assignedUserFactory.build({
        username: 'usernameOne',
        forename: 'Alice',
        surname: 'Smith',
      })

      expect(staffName(staff, username)).toEqual('You (Alice Smith)')
    },
  )

  it('returns the assignedTo name when the assignedTo username does not match the given username', () => {
    const staff = assignedUserFactory.build({
      username: 'bob_johnson',
      forename: 'Bob',
      surname: 'Johnson',
    })

    expect(staffName(staff, 'alice_smith')).toEqual('Bob Johnson')
  })

  it('returns the assignedTo name when the given username is undefined', () => {
    const staff = assignedUserFactory.build({
      username: 'bob_johnson',
      forename: 'Bob',
      surname: 'Johnson',
    })

    expect(staffName(staff)).toEqual('Bob Johnson')
  })
})
