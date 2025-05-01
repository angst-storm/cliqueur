export const fetchPresentationHtml = async (id) => {
    const s3Endpoint = process.env.REACT_APP_S3_ENDPOINT_URL || 'http://localhost:9000';
    const bucketName = process.env.REACT_APP_S3_BUCKET_NAME || 'presentations';

    const url = `${s3Endpoint}/${bucketName}/${id}/index.html`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Не удалось загрузить презентацию: ${response.status}`);
    }

    return await response.text();
};

export const parseSlidesFromHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    return Array.from(doc.querySelectorAll('.slide')).map(el => {
        const style = el.getAttribute('style') || '';
        const wMatch = style.match(/width\s*:\s*(\d+)px/);
        const hMatch = style.match(/height\s*:\s*(\d+)px/);
        return {
            html: el.innerHTML,
            width: wMatch ? parseInt(wMatch[1], 10) : null,
            height: hMatch ? parseInt(hMatch[1], 10) : null,
        };
    });
};

export const parseSlidesAsDomElements = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('.slide'));
};

