# Modular Gameplay Patterns

Keep gameplay rules cohesive and easy to extend. These are general design recommendations, not requirements to impose on every project. Follow the target repository's existing conventions and scale the structure to the game.

## Separate Responsibilities

- Keep the application bootstrap focused on composition and lifecycle. Delegate input, scene transitions, actor creation, and rendering coordination to focused modules or systems as the project grows.
- Keep player intent and interaction rules in gameplay code. Make the priority between nearby actions explicit so one input does not trigger several competing interactions.
- Give inventory and other mutable collections a clear owner. Route pickup, removal, use, and transfer through that owner so the UI and world state cannot drift apart.
- Keep UI presentation separate from game rules. Have the HUD read or receive game state instead of owning a second copy of score, health, inventory, or timers.
- Isolate timed sequences, dialogue flow, and multi-step events from the main render loop. Represent their state transitions explicitly and make cancellation or scene changes predictable.
- Organize actor behavior by game concept when useful, but avoid inheritance trees that only share a name. Use composition or small systems when behaviors need to combine independently.

## Interaction Workflow

For an action such as talking, picking up an item, or attacking:

1. Convert device input into a game-level action or intent.
2. Query valid targets using engine-supported collision or interaction APIs.
3. Resolve target selection and action priority in one place.
4. Apply the gameplay state change once, then notify or render the result.
5. Test edge cases such as no target, multiple targets, full inventory, paused state, and a target removed during the action.

For spawning actors from level content, keep the authored spawn identifier/property separate from the runtime actor instance. Validate the referenced definition and layer, await required asset loading, and ensure every spawned object receives the current level/view references it needs.

## Avoid

- One global singleton that every actor and UI component can mutate.
- Duplicated ownership of gameplay state between actors, managers, and UI.
- Adding all behavior to a single `Main`/`Game` class or the HTML entrypoint.
- Assuming a demo's script order, inline content, or debug controls are appropriate for a production build.
- Abstracting a small mechanic into a generic framework before a second real use case exists.