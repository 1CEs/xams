/**
 * Aiken Format Validation Utility
 * Validates Aiken format files for proper syntax and structure
 */

export interface AikenValidationError {
  line: number;
  message: string;
  type: 'question' | 'option' | 'answer' | 'structure';
}

export interface AikenValidationResult {
  isValid: boolean;
  errors: AikenValidationError[];
  warnings: AikenValidationError[];
  questionCount: number;
}

/**
 * Validates Aiken format content
 * @param content - The raw text content of the Aiken file
 * @returns AikenValidationResult with validation status and errors
 */
export function validateAikenFormat(content: string): AikenValidationResult {
  const lines = content.split('\n').map(line => line.trim());
  const errors: AikenValidationError[] = [];
  const warnings: AikenValidationError[] = [];
  let questionCount = 0;
  
  let currentQuestionStart = -1;
  let currentQuestionText = '';
  let currentOptions: string[] = [];
  let hasAnswer = false;
  let expectedOptions = ['A', 'B', 'C', 'D']; // Standard Aiken format expects A, B, C, D
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Skip empty lines
    if (line === '') {
      // If we were in the middle of a question, finalize it
      if (currentQuestionStart !== -1) {
        validateCurrentQuestion();
        resetCurrentQuestion();
      }
      continue;
    }
    
    // Check if this is an ANSWER line
    if (line.startsWith('ANSWER:')) {
      if (currentQuestionStart === -1) {
        errors.push({
          line: lineNumber,
          message: 'ANSWER line found without a preceding question',
          type: 'answer'
        });
        continue;
      }
      
      const answerValue = line.substring(7).trim();
      
      // Validate answer format
      if (!answerValue) {
        errors.push({
          line: lineNumber,
          message: 'ANSWER line is empty',
          type: 'answer'
        });
      } else if (!/^[A-D]$/.test(answerValue)) {
        errors.push({
          line: lineNumber,
          message: `Invalid answer format: "${answerValue}". Answer must be A, B, C, or D`,
          type: 'answer'
        });
      } else if (!currentOptions.includes(answerValue)) {
        errors.push({
          line: lineNumber,
          message: `Answer "${answerValue}" does not correspond to any provided option`,
          type: 'answer'
        });
      }
      
      hasAnswer = true;
      continue;
    }
    
    // Check if this is an option line (A., B., C., D.)
    if (/^[A-D]\.\s/.test(line)) {
      const optionLetter = line.charAt(0);
      const optionText = line.substring(3).trim();
      
      if (currentQuestionStart === -1) {
        errors.push({
          line: lineNumber,
          message: 'Option found without a preceding question',
          type: 'option'
        });
        continue;
      }
      
      // Check if option text is empty or incomplete
      if (!optionText) {
        errors.push({
          line: lineNumber,
          message: `Option ${optionLetter} has no text`,
          type: 'option'
        });
      }
      
      // Check for duplicate options
      if (currentOptions.includes(optionLetter)) {
        errors.push({
          line: lineNumber,
          message: `Duplicate option ${optionLetter} found`,
          type: 'option'
        });
      }
      
      currentOptions.push(optionLetter);
      continue;
    }
    
    // If we reach here, this should be a question line
    // First, finalize any previous question
    if (currentQuestionStart !== -1) {
      validateCurrentQuestion();
      resetCurrentQuestion();
    }
    
    // Start new question
    currentQuestionStart = lineNumber;
    currentQuestionText = line;
    
    // Validate question text
    if (!line.trim()) {
      errors.push({
        line: lineNumber,
        message: 'Question text is empty',
        type: 'question'
      });
    } else if (line.length < 10) {
      warnings.push({
        line: lineNumber,
        message: 'Question text is very short, might be incomplete',
        type: 'question'
      });
    } else if (!line.includes('?') && !line.endsWith(':') && !line.includes('following')) {
      warnings.push({
        line: lineNumber,
        message: 'Question might be missing a question mark or proper ending',
        type: 'question'
      });
    }
  }
  
  // Validate the last question if file doesn't end with empty line
  if (currentQuestionStart !== -1) {
    validateCurrentQuestion();
  }
  
  function validateCurrentQuestion() {
    if (currentQuestionStart === -1) return;
    
    questionCount++;
    
    // Check if question has options
    if (currentOptions.length === 0) {
      errors.push({
        line: currentQuestionStart,
        message: 'Question has no options',
        type: 'structure'
      });
    } else {
      // Check if we have all required options (A, B, C, D)
      const missingOptions = expectedOptions.filter(opt => !currentOptions.includes(opt));
      if (missingOptions.length > 0) {
        errors.push({
          line: currentQuestionStart,
          message: `Question is missing options: ${missingOptions.join(', ')}`,
          type: 'structure'
        });
      }
      
      // Check for unexpected options
      const unexpectedOptions = currentOptions.filter(opt => !expectedOptions.includes(opt));
      if (unexpectedOptions.length > 0) {
        errors.push({
          line: currentQuestionStart,
          message: `Question has unexpected options: ${unexpectedOptions.join(', ')}`,
          type: 'structure'
        });
      }
      
      // Check option order
      const sortedOptions = [...currentOptions].sort();
      const expectedOrder = currentOptions.slice().sort();
      if (JSON.stringify(currentOptions) !== JSON.stringify(sortedOptions)) {
        warnings.push({
          line: currentQuestionStart,
          message: 'Options are not in alphabetical order (A, B, C, D)',
          type: 'structure'
        });
      }
    }
    
    // Check if question has answer
    if (!hasAnswer) {
      errors.push({
        line: currentQuestionStart,
        message: 'Question is missing ANSWER line',
        type: 'answer'
      });
    }
  }
  
  function resetCurrentQuestion() {
    currentQuestionStart = -1;
    currentQuestionText = '';
    currentOptions = [];
    hasAnswer = false;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    questionCount
  };
}

/**
 * Formats validation errors for display
 * @param result - The validation result
 * @returns Formatted error message string
 */
export function formatValidationErrors(result: AikenValidationResult): string {
  if (result.isValid) {
    return `✅ Valid Aiken format file with ${result.questionCount} questions.`;
  }
  
  let message = `❌ Invalid Aiken format file. Found ${result.errors.length} error(s)`;
  if (result.warnings.length > 0) {
    message += ` and ${result.warnings.length} warning(s)`;
  }
  message += `:\n\n`;
  
  // Group errors by type
  const errorsByType = result.errors.reduce((acc, error) => {
    if (!acc[error.type]) acc[error.type] = [];
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, AikenValidationError[]>);
  
  Object.entries(errorsByType).forEach(([type, errors]) => {
    message += `**${type.toUpperCase()} ERRORS:**\n`;
    errors.forEach(error => {
      message += `  Line ${error.line}: ${error.message}\n`;
    });
    message += '\n';
  });
  
  if (result.warnings.length > 0) {
    message += `**WARNINGS:**\n`;
    result.warnings.forEach(warning => {
      message += `  Line ${warning.line}: ${warning.message}\n`;
    });
  }
  
  return message;
}

/**
 * Quick validation check for Aiken content
 * @param content - The raw text content
 * @returns boolean indicating if content is valid
 */
export function isValidAikenFormat(content: string): boolean {
  return validateAikenFormat(content).isValid;
}
