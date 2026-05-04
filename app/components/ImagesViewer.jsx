import { useId } from 'react';
import useFancybox from '../hooks/useFancybox';

/**
 *
 * @param props - Component properties
 * @param {string[]} props.images - List of images
 * @constructor
 */
const ImagesViewer = (props) => {
  const [fancyboxRef] = useFancybox({});

  const _id = useId();

  if (!props?.images?.length) {
    return <s-text tone="neutral">No images</s-text>;
  }

  return (
    <div ref={fancyboxRef} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {props.images.map((url, index) => (
        <a key={`carousal_${_id}_${index}`} data-fancybox="gallery" href={url}>
          <img src={url} style={{ width: 30, borderRadius: 6, border: '1px solid #0000000f' }} alt=""/>
        </a>
      ))}
    </div>
  );
};

export default ImagesViewer;
