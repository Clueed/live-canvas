**I. Introduction: How We Will Work**

1. I will provide the initial function/tool definition structure.
2. You will propose revised versions focusing *only* on the `description` fields, following the guidelines outlined in Parts II and III below.
3. I will review my proposed descriptions and provide feedback, clarifications, or corrections.
4. We will repeat this iterative process until the descriptions meet your requirements.

I will adhere to the structural integrity rules, focusing solely on the `description` fields you provide and preserving all other parts of the function/tool definitions verbatim.

**Important Notes:**

* The previous version of the `description` fields should **not** be returned.
* All output must be valid JavaScript or JSON (depending on the format of the input).

**II. Guidelines for Description Content**

**A. Core Function Definition:**

1. **Lead with a Concise Purpose Statement:** Begin with a clear, succinct sentence defining the function's primary capability and core value. Avoid introductory fluff.
2. **Elaborate on Key Use Cases:** Briefly outline specific, high-value scenarios where the function is useful, framed around user goals or pain points.
3. **Define Scope and Limitations Explicitly:** Clarify what the function cannot do—especially around access control, authentication, unsupported data types, or operations.
4. **Specify "When NOT to Use":** State counterexamples or inappropriate use cases to prevent misuse.
5. **Suggest User-Facing Nomenclature:** If applicable, recommend how the assistant should refer to the tool when speaking with users.

**B. Parameter Documentation:**

6. **Describe Each Parameter's Role:** Clearly explain what each parameter does and how it affects the function's behavior.
7. **Specify Data Types and Formats:** Note expected types (e.g., string, boolean) and formats (e.g., RFC3339). Include examples.
8. **Detail Complex Query Syntax:** Document supported syntax for any complex parameters (e.g., search queries), using lists or tables where helpful.
9. **Explain Default Values and Optionality:** Note defaults and what happens if optional parameters are omitted.
10. **Clarify Interdependencies:** Flag any parameters that depend on or affect others.
11. **Address Edge Cases and Constraints:** Note known limitations or values to avoid.

**C. Usage Notes and Interaction:**

12. **Explain Handling of Results:** Describe pagination, truncation, and how the assistant should communicate result state to users.
13. **Outline Interaction with Other Tools:** Indicate if this tool is commonly used in a sequence with others.
14. **Provide Strategic Guidance:** Offer practical tips for use—query techniques, debug steps, or optimization advice.

**D. Examples:**

15. **Include Concrete Examples:** Show realistic function invocations demonstrating common usage.
16. **Demonstrate Both Simple and Complex Usage:** Include both basic and advanced examples.
17. **Showcase Expected Output (If Applicable/Concise):** Briefly illustrate key aspects of the output, when helpful.

**III. Formatting and Structural Integrity Rules**

1. **Primary Focus:** Revise *only* the `description` fields.
2. **Structural Integrity:** Preserve all other code elements exactly as provided, including naming, syntax, casing, formatting, and structure. Do not modify anything beyond the `description` fields unless explicitly instructed.
3. **Output Format:** The entire result must be valid JavaScript or JSON, depending on the format used in the input.
