const rsvpDialog = document.querySelector('.rsvp-dialog');
const rsvpForm = document.querySelector('.rsvp-form');
const rsvpError = document.querySelector('.rsvp-error');
const rsvpConfirmation = document.querySelector('.rsvp-confirmation');
const openRsvpButton = document.querySelector('[data-open-rsvp]');
const closeRsvpButtons = document.querySelectorAll('[data-close-rsvp]');
const phoneField = rsvpForm.elements.phone;
const submitRsvpButton = rsvpForm.querySelector('button[type="submit"]');
const submitRsvpLabel = submitRsvpButton.querySelector('.submit-label');
const rsvpEndpoint = 'https://of73u4pjsfywnjpqrib4n37q5a0nmffb.lambda-url.us-east-1.on.aws';

const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);

    if (digits.length < 4) {
        return digits;
    }

    if (digits.length < 7) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const isRsvpd = () => document.cookie.includes('rsvpd=true');

const showConfirmation = () => {
    rsvpForm.hidden = true;
    rsvpConfirmation.hidden = false;
    rsvpConfirmation.querySelector('h2').focus();
};

const setLoading = (isLoading) => {
    submitRsvpButton.disabled = isLoading;
    submitRsvpButton.setAttribute('aria-busy', String(isLoading));
    submitRsvpLabel.textContent = isLoading ? 'Sending' : 'Submit RSVP';
    rsvpForm.querySelectorAll('input, select').forEach((field) => {
        field.disabled = isLoading;
    });
};

openRsvpButton.addEventListener('click', () => {
    rsvpForm.hidden = false;
    rsvpConfirmation.hidden = true;
    rsvpForm.reset();
    rsvpError.textContent = '';
    setLoading(false);
    rsvpForm.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
        field.removeAttribute('aria-invalid');
    });
    rsvpDialog.showModal();
    rsvpDialog.querySelector('input').focus();
});

closeRsvpButtons.forEach((button) => {
    button.addEventListener('click', () => {
        rsvpDialog.close();
    });
});

rsvpDialog.addEventListener('click', (event) => {
    if (event.target === rsvpDialog) {
        rsvpDialog.close();
    }
});

rsvpForm.addEventListener('input', (event) => {
    if (event.target.matches('input')) {
        event.target.removeAttribute('aria-invalid');
        rsvpError.textContent = '';
    }
});

phoneField.addEventListener('input', () => {
    phoneField.value = formatPhoneNumber(phoneField.value);
});

if (isRsvpd()) {
    openRsvpButton.disabled = true;
    rsvpDialog.showModal();
    showConfirmation();
}

rsvpForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const firstNameField = rsvpForm.elements['first-name'];
    const lastNameField = rsvpForm.elements['last-name'];
    const guestCountField = rsvpForm.elements['guest-count'];

    rsvpForm.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
        field.removeAttribute('aria-invalid');
    });

    const invalidField = [firstNameField, lastNameField, phoneField, guestCountField].find((field) => {
        return !field.validity.valid;
    });

    if (invalidField) {
        invalidField.setAttribute('aria-invalid', 'true');
        rsvpError.textContent = 'Please complete your name and enter a 10-digit phone number.';
        invalidField.focus();
        return;
    }

    const toSend = {
        firstName: firstNameField.value,
        lastName: lastNameField.value,
        phone: phoneField.value,
        guestCount: guestCountField.value,
    };

    setLoading(true);
    rsvpError.textContent = '';

    try {
        await fetch(rsvpEndpoint, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(toSend),
        });

        document.cookie = 'rsvpd=true; max-age=31536000';
        openRsvpButton.disabled = true;
        showConfirmation();
    } catch (error) {
        rsvpError.textContent = 'Something went wrong. Please try submitting your RSVP again.';
        setLoading(false);
    }
});
