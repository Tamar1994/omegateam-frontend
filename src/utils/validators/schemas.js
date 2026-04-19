/**
 * Validadores com Zod - Valida dados de forma robusta
 * 
 * Uso em formulários:
 * const schema = z.object({
 *   email: validateEmail,
 *   senha: validatePassword,
 * });
 * 
 * try {
 *   const dados = schema.parse(formData);
 * } catch (err) {
 *   console.error(err.errors);
 * }
 */

// Email
export const validateEmail = {
  required: 'Email é obrigatório',
  validate: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return 'Email inválido';
    }
    return true;
  },
};

// Senha (mínimo 8 caracteres, 1 maiúscula, 1 número)
export const validatePassword = {
  required: 'Senha é obrigatória',
  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
  validate: (value) => {
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);

    if (!hasUpperCase) return 'Precisa de letra maiúscula';
    if (!hasLowerCase) return 'Precisa de letra minúscula';
    if (!hasNumber) return 'Precisa de número';

    return true;
  },
};

// Confirmação de Senha
export const validatePasswordConfirm = (passwordField) => ({
  required: 'Confirme a senha',
  validate: (value, formValues) => {
    if (value !== formValues[passwordField]) {
      return 'Senhas não conferem';
    }
    return true;
  },
});

// Nome
export const validateName = {
  required: 'Nome é obrigatório',
  minLength: { value: 3, message: 'Mínimo 3 caracteres' },
  maxLength: { value: 50, message: 'Máximo 50 caracteres' },
  validate: (value) => {
    const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!regex.test(value)) {
      return 'Apenas letras permitidas';
    }
    return true;
  },
};

// Sobrenome
export const validateSurname = {
  required: 'Sobrenome é obrigatório',
  minLength: { value: 2, message: 'Mínimo 2 caracteres' },
  maxLength: { value: 50, message: 'Máximo 50 caracteres' },
};

// Telefone
export const validatePhone = {
  validate: (value) => {
    if (!value) return true; // Opcional
    const regex = /^(\d{10}|\d{11})$/;
    if (!regex.test(value.replace(/\D/g, ''))) {
      return 'Telefone inválido (10 ou 11 dígitos)';
    }
    return true;
  },
};

// CPF
export const validateCPF = {
  validate: (value) => {
    if (!value) return true; // Opcional
    
    const cpf = value.replace(/\D/g, '');
    
    if (cpf.length !== 11) {
      return 'CPF deve ter 11 dígitos';
    }
    
    // Verifica dígitos repetidos
    if (/^(\d)\1{10}$/.test(cpf)) {
      return 'CPF inválido';
    }
    
    // Valida dígitos verificadores (simplificado)
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) {
      return 'CPF inválido';
    }
    
    return true;
  },
};

// Data de Nascimento
export const validateBirthDate = {
  required: 'Data de nascimento é obrigatória',
  validate: (value) => {
    const date = new Date(value);
    const today = new Date();
    
    if (date > today) {
      return 'Data não pode ser no futuro';
    }
    
    const age = today.getFullYear() - date.getFullYear();
    if (age < 5 || age > 120) {
      return 'Idade inválida (5-120 anos)';
    }
    
    return true;
  },
};

// URLs
export const validateURL = {
  validate: (value) => {
    if (!value) return true; // Opcional
    try {
      new URL(value);
      return true;
    } catch {
      return 'URL inválida';
    }
  },
};

// Combinação de validações
export const combineValidators = (...validators) => ({
  validate: (value, formValues) => {
    for (const validator of validators) {
      if (typeof validator.validate === 'function') {
        const result = validator.validate(value, formValues);
        if (result !== true) return result;
      }
    }
    return true;
  },
  ...validators.reduce((acc, v) => ({ ...acc, ...v }), {}),
});

/**
 * Validadores por contexto/domínio
 */

// Inscrição em Campeonato
export const validatorsInscricao = {
  modalidade: { required: 'Escolha uma modalidade' },
  categoria: { required: 'Escolha uma categoria' },
  faixa: { required: 'Escolha uma faixa' },
  idade: { required: 'Escolha uma faixa etária' },
};

// Criação de Campeonato
export const validatorsCampeonato = {
  nome: {
    required: 'Nome do campeonato é obrigatório',
    minLength: { value: 5, message: 'Mínimo 5 caracteres' },
  },
  local: { required: 'Local é obrigatório' },
  data_inicio: { required: 'Data de início é obrigatória' },
  data_fim: { required: 'Data de fim é obrigatória' },
};

/**
 * Função auxiliar para retornar mensagem de erro
 */
export const getErrorMessage = (validator, fieldName = '') => {
  if (typeof validator.required === 'string') {
    return validator.required;
  }
  if (validator.minLength) {
    return validator.minLength.message || `Mínimo ${validator.minLength.value} caracteres`;
  }
  if (validator.maxLength) {
    return validator.maxLength.message || `Máximo ${validator.maxLength.value} caracteres`;
  }
  return 'Campo inválido';
};
