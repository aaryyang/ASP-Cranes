#!/usr/bin/env python3
"""
Quick test script to check agent response formatting
"""
import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.getcwd())

from sales_service.prompts import INSTRUCTION

def test_prompt_formatting():
    """Test that the prompt has good formatting guidelines"""
    print("=== PROMPT FORMATTING TEST ===")
    print(f"Prompt length: {len(INSTRUCTION)} characters")
    
    # Check for formatting guidelines
    has_formatting_section = "RESPONSE FORMATTING GUIDELINES" in INSTRUCTION
    print(f"Has formatting guidelines: {has_formatting_section}")
    
    # Check for excessive repetition
    lines = INSTRUCTION.split('\n')
    unique_lines = set(lines)
    repetition_ratio = len(unique_lines) / len(lines)
    print(f"Content uniqueness ratio: {repetition_ratio:.2f}")
    
    if has_formatting_section and repetition_ratio > 0.8:
        print("✅ Prompt formatting looks good!")
        return True
    else:
        print("❌ Prompt needs improvement")
        return False

if __name__ == "__main__":
    test_prompt_formatting()
