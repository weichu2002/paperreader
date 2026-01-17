export const MOCK_DELAY = 1000;
export const POLLING_INTERVAL = 2000;

export const SAMPLE_PDF_TEXT = [
  {
    page: 1,
    content: `
      Abstract
      
      Recent advances in large language models (LLMs) have revolutionized natural language processing. 
      However, integrating these models into structured knowledge extraction pipelines remains a challenge. 
      This paper, CiteRepo, introduces a novel architecture for managing and analyzing citation networks 
      using a retrieval-augmented generation (RAG) approach. We demonstrate that CiteRepo improves 
      citation accuracy by 45% compared to baseline methods.

      1. Introduction
      
      The exponential growth of scientific literature necessitates automated tools for efficient knowledge discovery. 
      Traditional citation managers offer limited semantic understanding. Our proposed system bridges this gap 
      by treating papers not just as static files, but as interactive knowledge bases.
    `
  },
  {
    page: 2,
    content: `
      2. Methodology

      Our system architecture comprises three main components: the Ingestion Engine, the Analysis Core, 
      and the User Interface. The Ingestion Engine normalizes PDF inputs into a unified text format, 
      preserving spatial layout information.
      
      2.1 Region Selection
      
      Users can select specific regions of a document (e.g., charts, formulas) for targeted analysis. 
      The coordinate system is normalized to [0, 1] relative to the page dimensions to ensure resolution independence.

      3. Experiments
      
      We evaluated CiteRepo on a dataset of 5,000 computer science papers. 
      Table 1 shows the precision and recall metrics across different citation styles.
    `
  }
];
