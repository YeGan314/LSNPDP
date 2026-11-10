<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" 
  xmlns="http://www.opengis.net/sld" 
  xmlns:ogc="http://www.opengis.net/ogc" 
  xmlns:xlink="http://www.w3.org/1999/xlink" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd">
  
  <NamedLayer>
    <Name>china_provinces</Name>
    <UserStyle>
      <Name>中国省级行政区划样式</Name>
      <Title>China Provinces Style</Title>
      <Abstract>全国省级行政区划样式，包含清晰边界、省份名称标注和白色掩膜</Abstract>
      
      <FeatureTypeStyle>
        <!-- 省份填充和边界 -->
        <Rule>
          <Name>省份区域</Name>
          <Title>Province Areas</Title>
          
          <!-- 多边形填充 -->
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#A67C52</CssParameter>
              <CssParameter name="fill-opacity">0.85</CssParameter>
            </Fill>
            <!-- 省份边界线 -->
            <Stroke>
              <CssParameter name="stroke">#654321</CssParameter>
              <CssParameter name="stroke-width">2</CssParameter>
              <CssParameter name="stroke-opacity">1.0</CssParameter>
              <CssParameter name="stroke-linejoin">round</CssParameter>
              <CssParameter name="stroke-linecap">round</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
          
          <!-- 省份名称标注 - 白色掩膜（光晕效果） -->
          <TextSymbolizer>
            <Label>
              <ogc:PropertyName>name</ogc:PropertyName>
            </Label>
            <Font>
              <CssParameter name="font-family">Microsoft YaHei</CssParameter>
              <CssParameter name="font-family">SimHei</CssParameter>
              <CssParameter name="font-family">Arial</CssParameter>
              <CssParameter name="font-size">16</CssParameter>
              <CssParameter name="font-weight">bold</CssParameter>
            </Font>
            <LabelPlacement>
              <PointPlacement>
                <AnchorPoint>
                  <AnchorPointX>0.5</AnchorPointX>
                  <AnchorPointY>0.5</AnchorPointY>
                </AnchorPoint>
              </PointPlacement>
            </LabelPlacement>
            <!-- 白色掩膜/光晕效果 -->
            <Halo>
              <Radius>3</Radius>
              <Fill>
                <CssParameter name="fill">#FFFFFF</CssParameter>
                <CssParameter name="fill-opacity">0.9</CssParameter>
              </Fill>
            </Halo>
            <!-- 文字颜色 -->
            <Fill>
              <CssParameter name="fill">#000000</CssParameter>
            </Fill>
            <!-- 文字描边（增强可读性） -->
            <VendorOption name="conflictResolution">false</VendorOption>
            <VendorOption name="goodnessOfFit">0.3</VendorOption>
            <VendorOption name="spaceAround">5</VendorOption>
            <VendorOption name="maxDisplacement">50</VendorOption>
            <VendorOption name="autoWrap">100</VendorOption>
          </TextSymbolizer>
        </Rule>
        
        <!-- 国界线（外边界加粗） -->
        <Rule>
          <Name>国界线</Name>
          <Title>National Border</Title>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#2C1810</CssParameter>
              <CssParameter name="stroke-width">3</CssParameter>
              <CssParameter name="stroke-opacity">1.0</CssParameter>
              <CssParameter name="stroke-linejoin">round</CssParameter>
              <CssParameter name="stroke-linecap">round</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
        
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
