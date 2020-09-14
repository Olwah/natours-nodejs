import '@babel/polyfill';
import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name, email, password, passwordConfirm) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/signup', // Can use relative path as API & website are hosted in the same place
            data: {
                name,
                email,
                password,
                passwordConfirm,
            }
        });

        if (res.data.status === 'success') {
            showAlert('success', 'Signup successful!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};