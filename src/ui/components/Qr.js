import { jsx as _jsx } from "react/jsx-runtime";
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
export function Qr({ text, size, label, color = '#1a1613' }) {
    const [svg, setSvg] = useState('');
    useEffect(() => {
        let live = true;
        QRCode.toString(text, {
            type: 'svg',
            errorCorrectionLevel: 'M',
            margin: 0,
            color: { dark: color, light: '#0000' },
        }).then((s) => {
            if (live)
                setSvg(s);
        });
        return () => {
            live = false;
        };
    }, [text, color]);
    return (_jsx("div", { role: "img", "aria-label": label, style: { width: size, height: size, lineHeight: 0 }, dangerouslySetInnerHTML: { __html: svg.replace('<svg ', `<svg width="${size}" height="${size}" `) } }));
}
