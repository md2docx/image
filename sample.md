## Images

```mmd
gantt
  title Banking Sector - Investment Timeline
  dateFormat YYYY-MM-DD
  axisFormat %Y-%m-%d
  section HDFC Bank
  Strategy Implementation           :a1, 2025-01-01, 90d
  section ICICI Bank
  Digital Expansion                 :a2, 2025-02-15, 75d
  section SBI
  Rural Initiatives                 :a3, 2025-03-01, 60d
  section Axis Bank
  Corporate Lending                 :a4, 2025-03-15, 45d
  section Kotak Mahindra Bank
  Wealth Management                 :a5, 2025-04-01, 30d
```

Embedding images in Markdown.

Non existent image replaced by placeholder image.

![I do not exist](https://example.com/some.jpg)

SVG:

![Markdown Logo](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg)

PNG:

![GitHub Logo](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)

Data URL:

![Yellow Circle Dat URL](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAYElEQVQYV2NkgIL//xmCgcxMIHaGCu0F0tMZGRnWgviMIAKoqANIlcM0odGtQMU1jEBFPkCJzTgUwYS9QAoPAHn2BBQeBCn8AFTET0DhR5IUEm21J9DabQQ9Q3TwEBvgACT3J/F3uWU/AAAAAElFTkSuQmCC)

## HTML Images

<p>
Here is an SVG image.
<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='129' height='20' aria-label='downloads: 1.0M'><linearGradient id='b' x2='0' y2='100%'><stop offset='0' stop-color='#bbb' stop-opacity='.1'/><stop offset='1' stop-opacity='.1'/></linearGradient><clipPath id='a'><rect width='129' height='20' fill='#fff' rx='3'/></clipPath><g clip-path='url(#a)'><path fill='#555' d='M0 0h86v20H0z'/><path fill='#4c1' d='M86 0h67v20H86z'/><path fill='url(#b)' d='M0 0h129v20H0z'/></g><g fill='#fff' font-family='Verdana,Geneva,DejaVu Sans,sans-serif' font-size='110' text-anchor='middle' text-rendering='geometricPrecision'><image xlink:href='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6IiBmaWxsPSIjY2IwMDAwIi8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTcgN2gyNnYyNmgtN1YxNGgtNnYxOUg3eiIvPjwvc3ZnPg==' width='14' height='14' x='5' y='3'/><text x='525' y='150' fill='#010101' fill-opacity='.3' aria-hidden='true' textLength='590' transform='scale(.1)'>downloads</text><text x='525' y='140' textLength='590' transform='scale(.1)'>downloads</text><text x='978' y='142' fill='#010101' fill-opacity='.3' aria-hidden='true' transform='scale(.11)'>1.0M</text><text x='968' y='135' transform='scale(.11)'>1.0M</text></g></svg>
</p>

<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAYElEQVQYV2NkgIL//xmCgcxMIHaGCu0F0tMZGRnWgviMIAKoqANIlcM0odGtQMU1jEBFPkCJzTgUwYS9QAoPAHn2BBQeBCn8AFTET0DhR5IUEm21J9DabQQ9Q3TwEBvgACT3J/F3uWU/AAAAAElFTkSuQmCC" alt="Sample Image" width="150" height="150" style="border-radius: 10px;" />

## 10. Diagrams (Mermaid)

Visualizing data with diagrams.

### Flowchart

```mermaid
graph TD;
  A-->B;
  A-->C;
  B-->D;
  C-->D;
```

### Sequence Diagram

```mermaid
sequenceDiagram
  participant A
  participant B
  A->>B: Hello, how are you?
  B->>A: I'm good, thanks!
```

### Mindmap

```mindmap
- Root
  - Branch 1
    - Subbranch 1
    - Subbranch 2
  - Branch 2
    - Subbranch 3
    - Subbranch 4
```

### Chart (Gantt)

```mermaid
gantt
  title Project Timeline
  dateFormat  YYYY-MM-DD
  section Development
  Task 1 :done, 2024-01-01, 2024-01-10
  Task 2 :active, 2024-01-11, 2024-01-20
  Task 3 : 2024-01-21, 2024-01-30
```

## 10. Diagrams (Mermaid)

Visualizing data with diagrams.

### Flowchart

```mermaid
graph TD;
  A-->B;
  A-->C;
  B-->D;
  C-->D;
```

### Sequence Diagram

```mermaid
sequenceDiagram
  participant A
  participant B
  A->>B: Hello, how are you?
  B->>A: I'm good, thanks!
```

### Mindmap

```mindmap
- Root
  - Branch 1
    - Subbranch 1
    - Subbranch 2
  - Branch 2
    - Subbranch 3
    - Subbranch 4
```

### Chart (Gantt)

```mermaid
gantt
  title Project Timeline
  dateFormat  YYYY-MM-DD
  section Development
  Task 1 :done, 2024-01-01, 2024-01-10
  Task 2 :active, 2024-01-11, 2024-01-20
  Task 3 : 2024-01-21, 2024-01-30
```

# Mermaid Diagrams Showcase

## 1. Flowchart

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Fix it]
    D --> B
```

## 2. Sequence Diagram

```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: I am fine, thanks!
```

## 3. Class Diagram

```mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    class Animal{
        +int age
        +String gender
        +isMammal()
        +mate()
    }
```

## 4. State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading
    Loading --> Success
    Loading --> Failure
    Success --> [*]
    Failure --> [*]
```

## 5. Gantt Chart

```mermaid
gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    Task 1           :a1, 2025-04-01, 3d
    Task 2           :after a1  , 4d
```

## 6. Pie Chart

```mermaid
pie
    title Pet Preferences
    "Dogs" : 40
    "Cats" : 30
    "Birds" : 20
    "Fish" : 10
```

## 7. Git Graph

```mermaid
gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
```

## 8. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    CUSTOMER }|..|{ DELIVERY_ADDRESS : uses
```

## 9. Journey Diagram

```mermaid
journey
    title User Journey
    section Sign Up
      User visits signup page: 5
      User enters details: 3
      User submits form: 4
    section Onboarding
      User reads tutorial: 3
      User sets preferences: 4
```

## 10. Requirement Diagram

```mermaid
requirementDiagram
    requirement req1 {
      id: 1
      text: The system shall respond to user input within 100ms.
    }
    requirement req2 {
      id: 2
      text: The system shall allow user registration.
    }
    element client {
      type: software
    }
    client - satisfies -> req1
    client - satisfies -> req2
```

## 11. Mindmap

```mermaid
mindmap
  root
    Origins
      Long history
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness
      On applications
    Tools
      Pen and paper
      Software
```

## 12. Quadrant Chart

```mermaid
quadrantChart
    title Reach vs Impact
    x-axis Low Reach --> High Reach
    y-axis Low Impact --> High Impact
    quadrant-1 Low Priority
    quadrant-2 Invest More
    quadrant-3 Reconsider
    quadrant-4 High Leverage
    "Small blog post": [0.3, 0.2]
    "Viral feature": [0.8, 0.9]
    "Internal tool": [0.5, 0.4]
```
