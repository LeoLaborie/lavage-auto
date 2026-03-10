import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StepAddress from '../StepAddress';
import '@testing-library/jest-dom';

// Mock the AddressAutocomplete component
jest.mock('@/components/AddressAutocomplete', () => {
    return function MockAddressAutocomplete({ value, onAddressSelect }: any) {
        return (
            <input 
                data-testid="mock-address-input" 
                value={value} 
                onChange={(e) => onAddressSelect(e.target.value)} 
            />
        );
    };
});

describe('StepAddress Component', () => {
    const mockSetAddress = jest.fn();
    const mockSetAddressError = jest.fn();
    const mockHandleBack = jest.fn();
    const mockHandleNext = jest.fn();

    const defaultProps = {
        address: '',
        setAddress: mockSetAddress,
        addressError: '',
        setAddressError: mockSetAddressError,
        handleBack: mockHandleBack,
        handleNext: mockHandleNext,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with default props', () => {
        render(<StepAddress {...defaultProps} />);
        
        expect(screen.getByText('Où ?')).toBeInTheDocument();
        expect(screen.getByText('Precedent')).toBeInTheDocument(); 
        expect(screen.getByText(/Continuer/)).toBeInTheDocument();
        // Check Next button is disabled when address is empty
        expect(screen.getByRole('button', { name: /Continuer/ })).toBeDisabled();
    });

    it('enables next button when address is provided', () => {
        render(<StepAddress {...defaultProps} address="10 rue de la paix" />);
        
        expect(screen.getByRole('button', { name: /Continuer/ })).not.toBeDisabled();
    });

    it('calls handleNext when next button is clicked', () => {
        render(<StepAddress {...defaultProps} address="10 rue de la paix" />);
        
        const nextButton = screen.getByRole('button', { name: /Continuer/ });
        fireEvent.click(nextButton);
        
        expect(mockHandleNext).toHaveBeenCalledTimes(1);
    });

    it('calls handleBack when back button is clicked', () => {
        render(<StepAddress {...defaultProps} />);
        
        const backButton = screen.getByText('← Retour'); // Fix: Need exact match or getByRole
        fireEvent.click(backButton);
        
        expect(mockHandleBack).toHaveBeenCalledTimes(1);
    });
    
    it('displays error message when addressError is provided', () => {
        render(<StepAddress {...defaultProps} addressError="Invalid address" />);
        
        expect(screen.getByText('Invalid address')).toBeInTheDocument();
    });
});
