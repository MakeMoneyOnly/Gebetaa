import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('Smoke Test', () => {
    it('renders basic div', () => {
        render(<div data-testid="smoke">Smoke Test</div>)
        expect(screen.getByTestId('smoke')).toHaveTextContent('Smoke Test')
    })
})
