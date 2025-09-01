# Project Development Standards and Requirements

## Tech Stack
- Next.js
- React
- TypeScript
- TailwindCSS
- shadcn/ui

## Theme Design
- Primary color: #ff540e
- Background color: black
- Text colors: 
  - Primary text: white/80
  - Secondary text: white/50
- Font: Sora

## UI Component Library Standards
1. All shadcn/ui components must be in the `src/components/ui` directory
2. All custom components must be in `src/components/ui-custom/` directory, they are based on shadcn/ui components
3. Must maintain component reusability and consistency
4. Components (like buttons, tabs, etc., should be imported from shadcn/ui or src/components/ui-custom)

## Component Standards
We have both light and dark modes, this functionality is already implemented
All wrapped components should support this functionality. This way we don't need to write it in every component, just once in the wrapped component.

### Layout Standards
- Maximum width: 1400px
- Padding: According to design
- Spacing: Use space-x-{n}
- Border color: white/30

### Responsive Design
- Default for desktop
- Must be mobile responsive

## Code Standards
1. Use TypeScript type definitions
2. Component props must have interfaces
3. Use forwardRef for ref handling
4. Use cn utility function for className merging
5. Use early return pattern
6. Components must have displayName

## Best Practices
1. Use Tailwind classes for all styling
2. Avoid inline styles
3. Keep components single responsibility
4. Extract reusable type definitions
5. Use semantic HTML tags
6. Maintain code readability and maintainability

## Performance Optimization
1. Use Next.js Image component
2. Use React.memo appropriately
3. Avoid unnecessary re-renders
4. Use appropriate dependency management

## Tools
- Use cn function for merging classNames
- Use shadcn/ui components as base
- Use TypeScript type checking

### Component Library
shadcn/ui

### Before any action, read the entire project. Consider issues comprehensively

### Don't use component library components directly, instead wrap them in custom components and use the wrapped versions
