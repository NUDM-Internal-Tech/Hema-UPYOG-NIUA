# multiStepsForm — DynamicForm sample module

Generic **single-step** and **multi-step** wizards using the shared DynamicForm stack.
Config is **local JSON** (no MDMS required). Shared helpers live **outside** this folder
in `packages/react-components/src/utilities/`.

## Quick map

```text
Home → choose Single or Multi
  Single:  /application → /check → /acknowledgement
  Multi:   /basic → /contact → /documents → /check → /acknowledgement
```

| Piece | Role |
|--------|------|
| `config/singleStepForm.json` | One fill step, `nextStep: null` |
| `config/multiStepForm.json` | Three fill steps chained by `nextStep` |
| `config/localOverrides.js` | JS-only rules (`crossFieldValidations`, `staticFields`) |
| `pageComponents/ExampleFormStep.js` | Thin `DynamicFormStep` wrapper (all steps reuse it) |
| `pages/employee/SingleStepWizard.js` | One-step router |
| `pages/employee/MultiStepWizard.js` | Multi-step router |
| `pages/employee/ExampleCheckPage.js` | Review + mock submit |
| `pages/employee/ExampleAcknowledgement.js` | Success / failure banner |

## Shared utilities (outside this module)

Import from `@nudmcdgnpm/digit-ui-react-components`:

| Helper | File |
|--------|------|
| `useDynamicWizard` | `utilities/useDynamicWizard.js` |
| `buildWizardSteps`, `createWizardGoNext`, `collectWizardFlatValues` | `utilities/wizardUtils.js` |
| `mergeRouteConfig`, `mergeSessionStepWithRouteConfig`, … | `utilities/checkPageUtils.js` |
| `buildApiPayload`, `validateFields`, … | `payloadUtils` / `validators` / `formUtils` |
| `DynamicForm` / `DynamicFormStep` / `DynamicCheckPage` | `molecules/` |

## Form JSON shape

Same as MDMS Estate masters — nested `field` objects:

```json
{
  "order": 1,
  "key": "EXAMPLE_FULL_NAME",
  "field": { "name": "fullName", "type": "text" },
  "validation": { "required": true },
  "options": []
}
```

Dropdowns use static `options` here so the example works offline. Replace with
`dataSource: { type: "MDMS", moduleName, masterName }` when moving to MDMS.

## How single vs multi differs

| | Single | Multi |
|--|--------|-------|
| JSON body length | 1 step | N steps |
| `nextStep` | `null` → `/check` | string → next route; last is `null` |
| Check page | `mode="single"` → one `DynamicCheckPage` | `mode="multi"` → one summary per step |
| Fill UI | Same `ExampleFormStep` | Same `ExampleFormStep` |

## Wire into employee UI (optional)

1. Add package dependency / workspace link like other modules.
2. Register `MultiStepsFormModule` in the employee `enabledModules` / module loader.
3. Open `/upyog-ui/employee/multistepsform` (path depends on your module code).

Until wired, use this folder as a **reference implementation** next to EST.

## Mock submit

`ExampleCheckPage` uses a fake `mutation.mutate` — no network call. The payload is
logged to the browser console. Replace with a real Digit hook when integrating.
