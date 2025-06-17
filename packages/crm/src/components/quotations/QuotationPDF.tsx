import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { QuotationTemplate, TemplateElement } from '../../types/quotationTemplate';

// Register fonts
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
});

interface QuotationPDFProps {
  template: QuotationTemplate;
  data: any;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter'
  } as Style,
  text: {
    fontSize: 10,
    marginBottom: 10
  } as Style,
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  } as Style,
  table: {
    width: 'auto',
    marginVertical: 10
  } as Style,
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 30,
    alignItems: 'center'
  } as Style,
  tableHeader: {
    backgroundColor: '#F3F4F6'
  } as Style,
  tableCell: {
    padding: 5
  } as Style,
  image: {
    marginBottom: 10
  } as Style,
  spacer: {
    height: 20
  } as Style,
  list: {
    marginLeft: 10,
    marginBottom: 10
  } as Style,
  listItem: {
    flexDirection: 'row',
    marginBottom: 5
  } as Style,
  bullet: {
    width: 10,
    fontSize: 10
  } as Style
});

export function QuotationPDF({ template, data }: QuotationPDFProps) {
  const renderElement = (element: TemplateElement) => {
    switch (element.type) {
      case 'text':
        return (
          <Text
            key={element.id}
            style={[
              styles.text,
              element.style && {
                fontSize: parseInt(element.style.fontSize || '10'),
                textAlign: element.style.alignment || 'left'
              } as Style
            ]}
          >
            {element.content}
          </Text>
        );

      case 'heading':
        return (
          <Text
            key={element.id}
            style={[
              styles.heading,
              element.style && {
                fontSize: parseInt(element.style.fontSize || '18'),
                textAlign: element.style.alignment || 'left'
              } as Style
            ]}
          >
            {element.content}
          </Text>
        );

      case 'table':
        if (!element.tableData?.headers || !element.dynamicField || !data[element.dynamicField]) {
          return null;
        }

        const tableData = data[element.dynamicField];
        const widths = element.tableData.widths || Array(element.tableData.headers.length).fill(`${100 / element.tableData.headers.length}%`);

        return (
          <View key={element.id} style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              {element.tableData.headers.map((header, index) => (
                <View key={index} style={[styles.tableCell, { width: widths[index] } as Style]}>
                  <Text>{header}</Text>
                </View>
              ))}
            </View>
            {tableData.map((row: any, rowIndex: number) => (
              <View key={rowIndex} style={styles.tableRow}>
                {element.tableData?.headers.map((header, colIndex) => (
                  <View key={colIndex} style={[styles.tableCell, { width: widths[colIndex] } as Style]}>
                    <Text>{row[header.toLowerCase()]}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );

      case 'image':
        return element.imageUrl ? (
          <Image
            key={element.id}
            src={element.imageUrl}
            style={[
              styles.image,
              element.style && {
                width: element.style.width,
                height: element.style.height
              } as Style
            ]}
          />
        ) : null;

      case 'list':
        if (!element.content) return null;
        const items = element.content.split('\n');
        return (
          <View key={element.id} style={styles.list}>
            {items.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.text, { flex: 1 } as Style]}>{item}</Text>
              </View>
            ))}
          </View>
        );

      case 'spacer':
        return <View key={element.id} style={styles.spacer} />;

      default:
        return null;
    }
  };

  return (
    <Document>
      <Page
        size={template.layout.pageSize}
        orientation={template.layout.orientation}
        style={[
          styles.page,
          {
            padding: template.layout.margins.top,
            fontFamily: template.branding.fontFamily || 'Inter'
          } as Style
        ]}
      >
        {template.elements.map(renderElement)}
      </Page>
    </Document>
  );
} 