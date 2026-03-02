
// page level Streaming (a whole simplified UI of a page) with loading.tsx
// Streaming is a data transfer technique that allows you to break down a route into smaller "chunks"
// and progressively stream them from the server to the client as they become ready
// loading.tsx is a special Next.js file built on top of React Suspense.
// It allows you to create fallback UI to show as a replacement while page content loads.
// Since loading.tsx is a level higher than /invoices/page.tsx and /customers/page.tsx in the file system,
// it's also applied to those pages. We can change this with Route Groups.
// Create a new folder called /(overview) inside the dashboard folder.
// Then, move your loading.tsx and page.tsx files inside the folder: 
// Now, the loading.tsx file will only apply to your dashboard overview page.
// Route groups allow you to organize files into logical groups without affecting the URL path structure.
// When you create a new folder using parentheses (), the name won't be included in the URL path.
// So / dashboard / (overview) / page.tsx becomes / dashboard.
// Here, you're using a route group to ensure loading.tsx only applies to your dashboard overview page.
// However, you can also use route groups to separate your application into sections
// (e.g. (marketing) routes and(shop) routes) or by teams for larger applications.
// There are two ways you implement streaming in Next.js:
// At the page level, with the loading.tsx file (which creates <Suspense> for you).
// At the component level, with <Suspense> for more granular control.
// Adding loading skeletons
// A loading skeleton is a simplified version of the UI.
// Many websites use them as a placeholder(or fallback) to indicate to users that the content is loading.
// Any UI you add in loading.tsx will be embedded as part of the static file,
// and sent first.Then, the rest of the dynamic content will be streamed from the server to the client.
// app/blog/posts/[id]/loading.tsx
export default function Loading() {
  return (
    <div style={{ padding: '2rem' }}>
      <div 
        style={{
          height: '2rem',
          width: '50%',
          background: '#f0f0f0',
          marginBottom: '1rem',
          borderRadius: '4px',
        }}
      />
      <div 
        style={{
          height: '1rem',
          width: '30%',
          background: '#f0f0f0',
          marginBottom: '2rem',
          borderRadius: '4px',
        }}
      />
      <div 
        style={{
          height: '1rem',
          background: '#f0f0f0',
          marginBottom: '0.5rem',
          borderRadius: '4px',
        }}
      />
      <div 
        style={{
          height: '1rem',
          background: '#f0f0f0',
          marginBottom: '0.5rem',
          borderRadius: '4px',
        }}
      />
      <div 
        style={{
          height: '1rem',
          width: '80%',
          background: '#f0f0f0',
          borderRadius: '4px',
        }}
      />
    </div>
  );
}
/* So far, you're streaming a whole page.
But you can also be more granular and stream specific components using React Suspense.
Suspense allows you to defer rendering parts of your application until some condition is met (e.g. data is loaded).
You can wrap your dynamic components in Suspense.
Then, pass it a fallback component to show while the dynamic component loads.
If you remember the slow data request, fetchRevenue(), this is the request that is slowing down the whole page.
Instead of blocking your whole page, you can use Suspense to stream only this component and immediately show the rest of the page's UI.
*/